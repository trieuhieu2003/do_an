import './App.css';
import { Routes, Route } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import Error404 from './pages/Error404';
import { routes } from './routes';

function App() {
  return (
    <>
      <Routes>
        <Route element={<DefaultLayout />}>
          {routes.map((route) => (
            <Route
              key={route.key}
              path={route.path}
              element={<route.component />}
            />
          ))}
        </Route>
        <Route path='*' element={<Error404 />} />
      </Routes>
    </>
  );
}

export default App;
