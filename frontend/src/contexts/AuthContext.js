import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { employeeAPI } from '../Services/api';

// Auto-detect WS URL with fallback
const WS_URL = "ws://stc-employee-portal.onrender.com/api/ws";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const webSocketRef = useRef(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const pingIntervalRef = useRef(null);
  const [newMessages, setNewMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [userChannels, setUserChannels] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [chatNavigationTarget, setChatNavigationTarget] = useState(null);

  // WebSocket Connect
  const connectWebSocket = (userId) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.log(" WebSocket already connected for:", userId);
      return;
    }
   const ws = new WebSocket(`${WS_URL}/${encodeURIComponent(userId)}`);


    // const ws = new WebSocket(`${WS_URL}/${encodeURIComponent(userId)}`);

    ws.onopen = () => {
      console.log(" WebSocket connected:", userId);
      webSocketRef.current = ws;
      setIsConnected(true);

      // Optimistically mark user as online
      setUserStatuses(prev => ({ ...prev, [userId]: "online" }));

      // Fetch all user statuses via HTTP API upon connection
      const fetchAllStatuses = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/users/status');
          if (response.ok) {
            const statuses = await response.json();
            const statusMap = statuses.reduce((acc, curr) => {
              acc[curr.user_id] = curr.status;
              return acc;
            }, {});
            setUserStatuses(prev => ({ ...prev, ...statusMap }));
          }
        } catch (error) {
          console.error("Failed to fetch all user statuses:", error);
        }
      };
      fetchAllStatuses();

      // Start heartbeat to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000); // ping every 30 seconds
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("AuthContext received WS message:", message);

        let messageHandled = false;

        if (message.type === "status_update") {
          setUserStatuses((prev) => ({
            ...prev,
            [message.user_id]: message.status,
          }));
          messageHandled = true;
        } else if (message.type === "all_statuses") {
          setUserStatuses(message.statuses || {});
          messageHandled = true;
        } else if (message.type === "chat_message" || message.type === "channel_message" || message.type === "personal_message") {
          // Add to newMessages if not from current user and not currently viewing
          if (message.sender_id !== userId && userId) { // userId is user.email from connectWebSocket
            const isChannelMessage = message.recipient_id && !message.recipient_id.includes('@');
            const isDirectMessage = message.recipient_id && message.recipient_id.includes('@');

            // Ensure this message is intended for the current user before proceeding.
            // For direct messages, recipient_id should be the user's ID.
            if (isDirectMessage && message.recipient_id !== userId) {
              return; // This DM is not for me, so I'll ignore it.
            }

            // For channel messages, check if the user is a member of that channel
            if (isChannelMessage && !userChannels.some(ch => ch.name === message.recipient_id)) {
              console.log(`Ignoring notification for channel '${message.recipient_id}' as user is not a member.`);
              return;
            }

            let shouldNotify = true;

            if (isChannelMessage && currentChannel === message.recipient_id) {
              shouldNotify = false; // Don't notify if user is viewing this channel
            } else if (isDirectMessage && currentChatUser === message.sender_id) {
              shouldNotify = false; // Don't notify if user is chatting with this person
            }

    if (shouldNotify) {
      setNewMessages((prev) => {
        // Avoid duplicate messages if server echoes back
        // Check by id, or by content + timestamp if id is missing
        const isDuplicate = prev.find(msg =>
          (msg.id && message.id && msg.id === message.id) ||
          (msg.content === message.content &&
           msg.senderName === message.sender_name && // sender_name might be more reliable than senderName
           msg.timestamp === message.timestamp)
        );
        if (isDuplicate) {
          return prev;
        }
        return [...prev, {
          id: message.id || `msg_${Date.now()}`,
          senderName: message.sender_name,
          content: message.content,
          timestamp: message.timestamp,
          recipient_id: message.recipient_id,
          channel: isChannelMessage ? message.recipient_id : null,
          isDirectMessage: isDirectMessage,
          type: 'message',
        }];
      });

      // Show browser notification if permission granted, no alert fallback
      const notificationTitle = isDirectMessage
        ? `New message from ${message.sender_name}`
        : `New message in ${message.recipient_id}`;
      showNotification(notificationTitle, {
        body: message.content,
        tag: `chat-${message.recipient_id}`, // Group notifications by channel/user
      });
    }
          }
          messageHandled = true;

          // Always dispatch custom event for components to listen to
          console.log("Dispatching handled message to components:", message.type);
          const customEvent = new CustomEvent('websocket-message', { detail: message });
          window.dispatchEvent(customEvent);
        } else if (message.type === "missed_messages") {
  // Handle missed messages by adding them to newMessages for notification display
  const missedMsgs = message.messages || [];
  // CRITICAL FIX: Ensure missed messages are for the current user before processing for notifications.
  // The backend sends this to a specific user, but this client-side check adds a layer of safety.
  const currentUserMissedMsgs = missedMsgs.filter(msg => {
    // It's a direct message to me OR it's a channel message for a channel I'm in.
    const isMyDirectMessage = msg.recipient_id === userId;
    const isMyChannelMessage = msg.channel_id && userChannels.some(ch => ch.name === msg.channel_id);
    return isMyDirectMessage || isMyChannelMessage;
  });

  if (currentUserMissedMsgs.length > 0) {
    setNewMessages((prev) => {
      const newMsgs = currentUserMissedMsgs.map(msg => ({
        id: msg.id || `missed_${Date.now()}_${Math.random()}`,
        senderName: msg.sender_name,
        content: msg.content,
        recipient_id: msg.recipient_id,
        timestamp: msg.timestamp,
        channel: msg.channel_id || (msg.recipient_id && !msg.recipient_id.includes('@') ? msg.recipient_id : null),
        isDirectMessage: msg.recipient_id && msg.recipient_id.includes('@'),
        type: 'missed_message'
      }));

      // Improved deduplication
      const combined = [...prev];
      newMsgs.forEach(newMsg => {
        const isDuplicate = combined.some(existing =>
          existing.id === newMsg.id ||
          (existing.content === newMsg.content &&
           existing.senderName === newMsg.senderName &&
           existing.timestamp === newMsg.timestamp)
        );
        if (!isDuplicate) {
          combined.push(newMsg);
        }
      });
      return combined;
    });

    // Show a single notification for all missed messages
    const lastMissed = currentUserMissedMsgs[currentUserMissedMsgs.length - 1];
    const notificationTitle = currentUserMissedMsgs.length > 1
      ? `You have ${currentUserMissedMsgs.length} missed messages`
      : `New message from ${lastMissed.sender_name}`;
    const notificationBody = currentUserMissedMsgs.length > 1
      ? `Last message from ${lastMissed.sender_name}: ${lastMissed.content}`
      : lastMissed.content;

    showNotification(notificationTitle, { body: notificationBody, tag: 'missed-messages' });
  }
  messageHandled = true;
  // Still dispatch to components for local message handling
  const customEvent = new CustomEvent('websocket-message', { detail: message });
  window.dispatchEvent(customEvent);
}

        // For unhandled message types (like missed_messages), dispatch a custom event
        // so that components can listen for them
        if (!messageHandled) {
          console.log("Dispatching unhandled message to components:", message.type);
          // Dispatch a custom event that components can listen for
          const customEvent = new CustomEvent('websocket-message', { detail: message });
          window.dispatchEvent(customEvent);
      }
      } catch (err) {
        console.error(" WS parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error(" WS Error:", err);
      setIsConnected(false);
    };

    ws.onclose = (e) => {
      console.warn(" WS Closed:", e.code, e.reason);
      webSocketRef.current = null;
      setIsConnected(false);
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          console.log(`Reconnecting WebSocket, attempt ${reconnectAttempts.current}`);
          connectWebSocket(userId);
        }, timeout);
      } else {
        setConnectionError("Unable to connect to WebSocket after multiple attempts.");
      }
    };
  };

  // WebSocket Disconnect
  const disconnectWebSocket = () => {
    if (webSocketRef.current) {
      console.log("🔌 Disconnecting WS for:", user?.id);
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  //  Auto-manage WS on user state
  useEffect(() => {
    if (user?.email) {
      connectWebSocket(user.email);
    } else {
      disconnectWebSocket();
    }
    return () => disconnectWebSocket();
  }, [user]);

  // Fetch user's channels for notification filtering
  useEffect(() => {
    const fetchUserChannels = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`http://localhost:8000/api/channels?user_id=${user.email}`);
          const channels = await response.json();
          setUserChannels(channels || []);
        } catch (error) {
          console.error("Failed to fetch user channels for AuthContext:", error);
        }
      }
    };
    fetchUserChannels();
  }, [user?.email]);

  // Fetch global data (all channels and employees) on user login
  useEffect(() => {
    const fetchGlobalData = async () => {
      if (user?.email) {
        try {
          // Fetch all channels
          const channelsResponse = await fetch('http://localhost:8000/api/channels');
          if (channelsResponse.ok) {
            const channels = await channelsResponse.json();
            setAllChannels(channels);
          } else {
            console.error("Failed to fetch all channels");
          }

          // Fetch all employees
          const employeesResponse = await fetch('http://localhost:8000/api/employees');
          if (employeesResponse.ok) {
            const employees = await employeesResponse.json();
            setAllEmployees(employees);
          } else {
            console.error("Failed to fetch all employees");
          }
        } catch (error) {
          console.error("Failed to fetch global data:", error);
        }
      }
    };
    fetchGlobalData();
  }, [user?.email]);

  //  Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("showtimeUser");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);

  
  const login = async (email, password) => {
    try {
      // Admin login
      if (email === "admin@showtimeconsulting.in" && password === "Welcome@123") {
        const adminUser = {
          id: email,
          name: "System Administrator",
          email,
          designation: "System Admin",
          department: "Admin",
          subDepartment: "System Admin",
          reviewer: "Management",
          isAdmin: true,
          loginTime: new Date().toISOString(),
        };
        setUser(adminUser);
        localStorage.setItem("showtimeUser", JSON.stringify(adminUser));

        // Request notification permission on successful login
        if ('Notification' in window) {
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            console.log('Notification permission requested on login:', permission);
            if (permission !== 'granted') {
              console.warn('Notification permission not granted:', permission);
            }
          } else {
            console.log('Notification permission already set:', Notification.permission);
          }
        }

        return adminUser;
      }

      // API login
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("showtimeUser", JSON.stringify(userData));

      // Request notification permission on successful login
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          console.log('Notification permission requested on login:', permission);
          if (permission !== 'granted') {
            console.warn('Notification permission not granted:', permission);
          }
        } else {
          console.log('Notification permission already set:', Notification.permission);
        }
      }

      return userData;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("showtimeUser");
    setUserStatuses({});
    console.log(" User logged out");
  };

  const sendWebSocketMessage = (message) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn(" WS not connected. Message not sent:", message);
    }
  };

  const clearNewMessages = () => {
    setNewMessages([]);
  };

  // Notification functions
  const showNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('Showing browser notification:', title);
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        ...options
      });

      // Add onclick handler to navigate to the correct chat
      notification.onclick = () => {
        console.log('Browser notification clicked. Data:', options.data);
        if (options.data) {
          if (options.data.channel) {
            navigateToChat({ type: 'channel', id: options.data.channel });
          } else if (options.data.isDirectMessage) {
            // For a DM, the target is the sender of the message
            navigateToChat({ type: 'dm', id: options.data.senderName });
          }
        }
        // Bring the window to the front
        window.focus();
      };

      return notification;
    } else {
      console.log('Browser notification permission not granted:', Notification.permission);
      // No alert fallback, messages are shown in the notification system
    }
    return null;
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }
    return Notification.permission;
  };

  const updateProfile = async (profileData) => {
    // This function now only updates the local state (in AuthContext and localStorage).
    // The API call is handled by the component that triggers the update (e.g., UserProfile.js).
    // This makes the function more generic and reusable.

    setUser((prev) => {
      const updatedUser = { ...prev, ...profileData };
      localStorage.setItem("showtimeUser", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const removeProfilePicture = async () => {
    if (!user || !user.email) {
      console.error("Cannot remove profile picture: user not logged in.");
      throw new Error("User not authenticated");
    }
    try {
      // Make a DELETE request to the new endpoint
      const response = await fetch(`http://localhost:8000/api/employees/${encodeURIComponent(user.email)}/profile-picture`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.detail || 'Failed to remove profile picture';
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. Ensure the backend is updated to handle profile picture removal.';
        }
        throw new Error(errorMessage);
      }

      const updatedUser = await response.json();

      // Update local state and localStorage with the response from the server
      updateProfile(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Failed to remove profile picture via API:", error);
      throw error;
    }
  };

  const uploadProfilePicture = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const signup = async ({ name, email, password, designation, department, team, empCode }) => {
    try {
      const response = await fetch('http://localhost:8000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, designation, department, team, empCode })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }
      // After successful signup, login the user
      return await login(email, password);
    } catch (err) {
      throw err;
    }
  };

  const navigateToChat = (target) => {
    // Target will be an object like { type: 'channel', id: 'general' } or { type: 'dm', id: 'user@email.com' }
    setChatNavigationTarget(target);
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    removeProfilePicture,
    loading,
    webSocketRef,
    sendWebSocketMessage,
    userStatuses,
    setUserStatuses,
    signup,
    uploadProfilePicture,
    isConnected,
    newMessages,
    clearNewMessages,
    setNewMessages, // Expose setNewMessages
    currentChannel,
    setCurrentChannel,
    currentChatUser,
    setCurrentChatUser,
    notificationPermission,
    showNotification,
    requestNotificationPermission,
  };
  value.allChannels = allChannels;
  value.allEmployees = allEmployees;
  value.navigateToChat = navigateToChat;
  value.chatNavigationTarget = chatNavigationTarget;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
