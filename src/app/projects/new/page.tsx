"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { projectApi, businessPlanApi } from "@/lib/api";
import Layout from '@/components/Layout';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    enterprise_name: "",
    project_name: "",
    description: "",
    team_members: "", // NEW: Team members field
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(""); // Add step tracking

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("请上传PDF文件");
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("文件大小不能超过20MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("请上传BP文档");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Step 1: Create project
      setCurrentStep("创建项目中...");
      setUploadProgress(25);

      const projectResponse = await projectApi.create(formData);
      const projectId = projectResponse.data.id;

      console.log("Project created successfully:", projectId);

      // Step 2: Upload BP document
      setCurrentStep("上传BP文档中...");
      setUploadProgress(50);

      // FIXED: Wrap upload in try-catch to handle file upload errors gracefully
      try {
        await businessPlanApi.upload(projectId, file);
        setUploadProgress(75);
        setCurrentStep("处理完成");
      } catch (uploadError) {
        console.warn("BP upload failed, but project created:", uploadError);
        // Don't fail the entire process - project was created successfully
        setCurrentStep("项目已创建，文档上传失败");
      }

      setUploadProgress(100);

      // Step 3: Navigate to project detail (always succeed if project was created)
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1000);

    } catch (err: any) {
      console.error("Project crezation error:", err);

      // FIXED: More specific error messages
      if (err.response?.status === 400) {
        setError("请检查项目信息是否正确填写");
      } else if (err.response?.status === 409) {
        setError("项目名称已存在，请使用其他名称");
      } else {
        setError(err.response?.data?.message || "创建项目失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto py-12">
            <div className="bg-white rounded-3xl shadow-2xl p-10">
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
                  <i className="fa-solid fa-upload text-purple-500 mr-2"></i> 上传BP文档
                </div>
                <div className="text-gray-400">请填写项目信息并上传BP（PDF格式，最大20MB）</div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
              )}

              {/* FIXED: Add progress indicator */}
              {loading && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    {currentStep}
                  </div>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="project_name">项目名称</label>
                  <input
                    id="project_name"
                    name="project_name"
                    type="text"
                    required
                    placeholder="请输入项目名称"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-gray-50 text-gray-800"
                    value={formData.project_name}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="enterprise_name">企业名称</label>
                  <input
                    id="enterprise_name"
                    name="enterprise_name"
                    type="text"
                    required
                    placeholder="请输入企业名称"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-gray-50 text-gray-800"
                    value={formData.enterprise_name}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* FIXED: Add optional description field */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="description">项目描述（可选）</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="请简要描述项目内容"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-gray-50 text-gray-800"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* NEW: Team Members Field */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="team_members">
                    团队成员（可选）
                  </label>
                  <textarea
                    id="team_members"
                    name="team_members"
                    placeholder="请输入团队成员信息，例如：张三（CEO）、李四（CTO）、王五（COO）"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-gray-50 text-gray-800"
                    value={formData.team_members}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    最多1000字符，可以包含职位信息和联系方式
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">BP文档</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 py-8 cursor-pointer hover:bg-purple-100 transition">
                    <i className="fa-solid fa-file-pdf text-4xl text-purple-400 mb-2"></i>
                    <span className="text-gray-500">拖拽文件到此处，或 <span className="text-purple-600 underline cursor-pointer">点击上传</span></span>
                    <span className="text-xs text-gray-400 mt-1">仅支持PDF，最大20MB</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                  {file && (
                    <div className="mt-4">
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-gray-500">{file.name}</span>
                        <span className="ml-auto text-xs text-green-500">
                          <i className="fa-solid fa-check mr-1"></i>已选择
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        大小: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-cloud-upload-alt mr-2"></i>
                  {loading ? "处理中..." : "提交"}
                </button>
              </form>
            </div>
          </div>
        </main>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
}