import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Paperclip, Trash2, X } from 'lucide-react';

const ChatInput = ({ onSendMessage, disabled, placeholder, replyTo, onClearReply }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || disabled) return;

    let fileData = null;
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('http://localhost:8000/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }
        fileData = await response.json();
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file. Please try again.');
        return;
      }
    }

    onSendMessage(newMessage, fileData);

    // Reset state
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white/90">
      {replyTo && (
        <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-500 rounded flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <strong>Replying to {replyTo.sender_name}:</strong> {replyTo.content}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearReply}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="text-gray-500 hover:text-gray-700"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder={replyTo ? `Reply to ${replyTo.sender_name}` : placeholder}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={(!newMessage.trim() && !selectedFile) || disabled}
          className="bg-[#225F8B] hover:bg-[#225F8B]/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {selectedFile && (
        <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
          <span className="text-sm text-gray-700">{selectedFile.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;