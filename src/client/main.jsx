import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import CheckIn from './CheckIn.jsx';
import './styles.css';

const path = window.location.pathname;
const Root = path === '/checkin' ? CheckIn : App;
createRoot(document.getElementById('root')).render(<Root />);
