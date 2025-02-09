import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import apiUrl from './config';


axios.defaults.baseURL = apiUrl;

const clientId = '995421977806-tf8qlcn3jt95q5m5ug5ppbqq4c0mnj6o.apps.googleusercontent.com'
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
         <App />
      </GoogleOAuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
