// src/components/NotToDoList.tsx
'use client';

import React, { useCallback } from 'react';
import { FiXCircle, FiRotateCcw, FiPlus } from 'react-icons/fi';
import { ListItem } from '@/types'; // Import ListItem type

interface NotToDoListProps {
  list: ListItem[];
  addToList: (text: string) => void;
  removeFromList: (id: number) => void;
}

const NotToDoList: React.FC<NotToDoListProps> = ({ list, addToList, removeFromList }) => {
  const handleAddNotToDo = (
    e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    const input = document.getElementById('notToDoInput') as HTMLInputElement;
    if (input && (e.type === 'click' || (e as React.KeyboardEvent).key === 'Enter')) {
      addToList(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-lg card-hover">
      <div className="flex gap-2 items-center mb-4">
        <FiXCircle className="w-6 h-6 text-red-500" />
        <h3 className="text-xl font-bold text-gray-800">What Not To Do</h3>
      </div>
      <ul id="notToDoList" className="mb-4 space-y-2">
        {list.map((item: ListItem) => (
          <li
            key={item.id}
            className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100"
          >
            <span className="text-gray-800">{item.text}</span>
            <button
              onClick={() => removeFromList(item.id)}
              className="p-1 text-red-500 rounded transition-all duration-300 hover:text-red-700 hover:bg-red-100"
              title="Remove item"
            >
              <FiRotateCcw className="w-4 h-4 transform rotate-90" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          id="notToDoInput"
          type="text"
          placeholder="Add item to avoid..."
          className="flex-1 p-3 rounded-lg border border-gray-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          onKeyPress={handleAddNotToDo}
        />
        <button
          id="addNotToDoBtn"
          className="px-4 py-3 text-white bg-black rounded-lg transition-all duration-300 hover:bg-gray-800"
          title="Add Item"
          onClick={handleAddNotToDo}
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotToDoList;
