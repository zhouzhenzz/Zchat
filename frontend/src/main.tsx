// src/main.tsx 应该长这样，不应该引用 App 组件
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router' 
import './index.css' // 确保全局样式已清理 Vite 默认值

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)