import {React} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './login';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
useEffect(()=>{
  localStorage.setItem("logged", false);
}, [])

root.render(
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </Router>
);
