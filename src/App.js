import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import Error404 from './pages/Error404';
import { routes } from './routes';

function App() {
  // Separate public and protected routes
  const publicRoutes = routes.filter(route => route.public);
  const protectedRoutes = routes.filter(route => !route.public);

  return (
    <>
      <Routes>
        {/* Public routes (no layout required) */}
        {publicRoutes.map((route) => (
          <Route
            key={route.key}
            path={route.path}
            element={<route.component />}
          />
        ))}
        
        {/* Protected routes (require DefaultLayout) */}
        <Route element={<DefaultLayout />}>
          {protectedRoutes.map((route) => (
            <Route
              key={route.key}
              path={route.path}
              element={<route.component />}
            />
          ))}
        </Route>
        
        {/* Redirect root to login page first */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Catch all route */}
        <Route path='*' element={<Error404 />} />
      </Routes>
    </>
  );
}

export default App;
