import {useState } from 'react';
import Login from './login';
import Inicio from './sections/inicio';
import {keyExpiration} from './variables/global'

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
    setLoginInfo("false",keyExpiration)
  }

  const [update, setUpdate] = useState(false);
  function updateFunc(){
    setUpdate(!update);
  }
  
  if(JSON.parse(localStorage.getItem('token')).value=="false") {
    return <Login updateApp={updateFunc}/>
  }
  
  return (
    <Inicio />
  );
}

export default App;
