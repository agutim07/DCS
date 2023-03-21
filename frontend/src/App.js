import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import isLogged from './login';
import { useNavigate} from "react-router-dom";
import Login from './login';
import Inicio from './sections/inicio';

function setLoginInfo(value, ttl) {
	const now = new Date()
  ttl = ttl * 1000;

	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	}

	localStorage.setItem('token', JSON.stringify(item))
}

function App() {
  if(!localStorage.getItem('token')){
    setLoginInfo("false",300)
  }

  const [update, setUpdate] = useState(false);
  function updateFunc(){
    setUpdate(!update);
  }

  console.log(JSON.parse(localStorage.getItem('token')).value);
  if(JSON.parse(localStorage.getItem('token')).value=="false") {
    return <Login updateApp={updateFunc}/>
  }
  
  return (
    <Inicio />
  );
}

export default App;
