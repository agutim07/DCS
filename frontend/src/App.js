import './App.css';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import isLogged from './login';
import { useNavigate} from "react-router-dom";

function App() {
  console.log(localStorage.getItem("logged"));
  const navigate = useNavigate();
  const logged = useState(localStorage.getItem("logged"));

  useEffect(() => {
    if (logged) {
      console.log("yes");
      navigate('/login');
    }else{
      console.log(localStorage.getItem("logged"));
    }
  })

  return (
    <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center" style={{ minHeight: '100vh'}}>
      <Typography component="h1" variant="h5">
      Si
      </Typography>
    </Grid>
  );
}

export default App;
