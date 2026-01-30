// src/App.jsx
import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { publicRoutes, commonRoutes, adminRoutes } from "@/route/routes.js";
import LoadingSpinner from "./components/LoadingSpinner";
import "./App.css";
import NotFound from "./components/NotFound";
import { store } from './app/store'
import { Provider } from 'react-redux'
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from "@/contexts/ThemeContext";
const RouteRenderer = () => {
  const { user } = useAuth();

  return (
    // <chat/>
    <Routes>
      {/* Public routes */}
      {publicRoutes.map(({ path, element: Element }) => (
        <Route
          key={path}
          path={path}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <Element />
            </Suspense>
          }
        />
      ))}

      {/* Common routes */}
      {commonRoutes.map(({ path, element: Element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <Element />
              </Suspense>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Admin routes */}
      {user?.role === "admin" &&
        adminRoutes.map(({ path, element: Element }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingSpinner />}>
                  <Element />
                </Suspense>
              </ProtectedRoute>
            }
          />
        ))}

      {/* Catch-all */}
      <Route
        path="*"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <div className="App">
              <Suspense fallback={<LoadingSpinner />}>
                <RouteRenderer />
              </Suspense>
            </div>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>

    </Provider>
  );
}

export default App;
