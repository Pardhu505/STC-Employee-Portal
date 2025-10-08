// Example: UserAvatar.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserAvatar = () => {
  const { user } = useAuth();
  if (!user) return null;

  return user.profilePicture ? (
    <img
      src={user.profilePicture}
      alt="Profile"
      style={{ width: 40, height: 40, borderRadius: '50%' }}
    />
  ) : (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {user.name[0]}
    </div>
  );
};

export default UserAvatar;