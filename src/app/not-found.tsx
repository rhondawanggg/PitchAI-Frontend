"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
      <div className="w-full max-w-md mx-auto py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center mb-2">
              <i className="fa-solid fa-brain text-white text-3xl"></i>
            </div>
            <div className="text-2xl font-extrabold bg-gradient-to-tr from-purple-500 to-pink-400 bg-clip-text text-transparent tracking-wide">PitchAI</div>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">页面未找到或发生错误</div>
          <div className="text-gray-500 mb-6 text-center">抱歉，您访问的页面不存在或发生了未知错误。请检查链接或返回首页。</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> 返回首页
          </button>
        </div>
      </div>
      {/* 引入FontAwesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
} 