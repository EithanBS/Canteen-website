import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'student') navigate('/student');
      else if (role === 'canteen_owner') navigate('/canteen');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-heading text-glow-strong">CANTEEN SYSTEM</h1>
        <p className="text-xl text-muted-foreground"></p>
        <Button onClick={() => navigate('/auth')} size="lg">Get Started</Button>
      </div>
    </div>
  );
};

export default Index;
