import {useState } from 'react';
import Login from './login';
import Inicio from './sections/inicio';
import {backend} from './variables/global'
import axios from "axios";

function setLoginInfo() {
	const now = new Date()
  var ttl = 99999999999 * 1000;

	const item = {
		value: "false",
		expiry: now.getTime() + ttl,
	}

	localStorage.setItem('token', JSON.stringify(item))
}

function App() {
  if(!localStorage.getItem('token')){
    setLoginInfo();
  }else{
    const now = new Date();
    if (now.getTime() > JSON.parse(localStorage.getItem('token')).expiry) {
      localStorage.removeItem('token');
      axios.get(`${backend}/logout`);
      setLoginInfo();
	  }
  }

  const [update, setUpdate] = useState(false);
  function updateFunc(){
    setUpdate(!update);
  }
  
  if(JSON.parse(localStorage.getItem('token')).value=="false") {
    return <Login updateApp={updateFunc}/>
  }
  
  return (
    <Inicio updateApp={updateFunc}/>
  );
}

export default App;
