import React from 'react';
<<<<<<< HEAD
import { useNavigate, Link } from 'react-router-dom';
=======
import { useNavigate } from 'react-router-dom';
>>>>>>> 06f023cec3d1107a77276ffc167723bdc2dcc36e
import { registerApi } from '@/api/user';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;

    try {
      await registerApi(data);
      alert('注册成功！');
      navigate('/login');
    } catch (err) {
      alert('注册失败，邮箱或用户名可能已被占用');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      <form onSubmit={handleRegister} className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center">立即加入</h2>
        <div className="space-y-4">
          <input name="username" type="text" placeholder="用户名" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none" />
          <input name="email" type="email" placeholder="电子邮箱" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none" />
          <input name="password" type="password" placeholder="密码 (至少6位)" minLength={6} required className="w-full p-4 bg-gray-50 rounded-2xl outline-none" />
          <button className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800">注 册</button>
<<<<<<< HEAD
          <div className="text-center mt-4">
            <span className="text-gray-600">已有账号？</span>
            <Link to="/login" className="text-black font-medium ml-2 hover:underline">
              立即登录
            </Link>
          </div>
=======
>>>>>>> 06f023cec3d1107a77276ffc167723bdc2dcc36e
        </div>
      </form>
    </div>
  );
}