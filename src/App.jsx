import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import { Loader } from './components/ui/Common';
import { useAuth } from './context/AuthContext';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Orders from './pages/Orders';
import ProductForm from './pages/ProductForm';
import Products from './pages/Products';
import Settings from './pages/Settings';
import SubCategories from './pages/SubCategories';
import Users from './pages/Users';
import Videos from './pages/Videos';

export default function App() {
  const { user, checking } = useAuth();

  if (checking) return <Loader text="Checking session…" />;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="subcategories" element={<SubCategories />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="videos" element={<Videos />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
