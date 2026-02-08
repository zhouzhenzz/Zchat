import React from 'react';
import { Navigate, createBrowserRouter, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import MessagePage from '@/pages/Message';
import LoginPage from '@/pages/Auth/Login';
import RegisterPage from '@/pages/Auth/Register';
import MomentsPage from '@/pages/Moments';
import TimelinePage from '@/pages/Profile/Timeline';

/**
 * 私有路由守卫：未登录（没 Token）时，强制踢回登录页
 */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  // 调试用日志，如果没反应，看控制台有没有这行
  console.log('[Guard] PrivateRoute Check, Token:', !!token); 
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * 公共路由守卫：已登录时，不允许访问登录/注册页
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  console.log('[Guard] PublicRoute Check, Token:', !!token);
  return token ? <Navigate to="/chat" replace /> : <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    // 访问根路径直接根据状态分流
    element: <Navigate to="/chat" replace />, 
  },
  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/register',
    element: <PublicRoute><RegisterPage /></PublicRoute>,
  },
  {
    path: '/chat',
    element: <PrivateRoute><MessagePage /></PrivateRoute>,
  },
  {
    path: '/profile',
    element: <PrivateRoute><MessagePage mode="profile" /></PrivateRoute>,
  },
  {
    path: '/friends', // 新增路由
    element: <PrivateRoute><MessagePage mode="friends" /></PrivateRoute>,
  },
  {
    path: '/moments', // 朋友圈路由
    element: <PrivateRoute><MomentsPage /></PrivateRoute>,
  },
  {
    path: '/timeline', // 个人时光轴路由
    element: <PrivateRoute><TimelinePage /></PrivateRoute>,
  },
  {
    path: '*',
    element: (
      <div className="h-screen flex items-center justify-center bg-[#f8f9fa] font-['Inter'] text-gray-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-gray-400 mt-4 mb-8">糟糕，页面走丢了</p>
          <Link 
            to="/chat" 
            className="inline-block bg-black text-white px-8 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg"
          >
            返回首页
          </Link>
        </div>
      </div>
    ),
  },
]);