import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminKeygenRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // URL hash가 #admin-keygen인 경우 키 생성 페이지로 리다이렉트
    if (window.location.hash === '#admin-keygen') {
      navigate('/keygen');
    }
  }, [navigate]);

  return null;
}

export default AdminKeygenRedirect;