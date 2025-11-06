import LoginCard from '@/components/LoginCard'
import RegisterCard from '@/components/RegisterCard'
import HomePage from '@/components/HomePage'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

function App() {
  

  return (
    <Router>
      <div className='flex flex-col grow'>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/signup" element={<RegisterCard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
