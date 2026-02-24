import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { supabase } from './supabase';

console.log("Supabase client:", supabase);

const root = createRoot(document.getElementById('root'));
root.render(<App />);