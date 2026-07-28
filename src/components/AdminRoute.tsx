import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  return <ProtectedRoute requireRole="admin" />;
};

export default AdminRoute;