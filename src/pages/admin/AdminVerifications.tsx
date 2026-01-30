import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminVerifications = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to profile page with verifications tab
    navigate('/admin/profile?tab=verifications', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminVerifications;
