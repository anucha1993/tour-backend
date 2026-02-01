"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ArrowLeft, Save, Loader2, Plane, Bus, Car, Ship } from "lucide-react";
import { transportsApi, TRANSPORT_TYPES } from "@/lib/api";

const typeIcons: Record<string, React.ReactNode> = {
  airline: <Plane className="h-4 w-4" />,
  bus: <Bus className="h-4 w-4" />,
  van: <Car className="h-4 w-4" />,
  boat: <Ship className="h-4 w-4" />,
};

export default function EditTransportPage() {
  const router = useRouter();
  const params = useParams();
  const transportId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    code: "",
    code1: "",
    name: "",
    type: "airline",
    status: "on",
    image: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    loadTransport();
  }, [transportId]);

  const loadTransport = async () => {
    try {
      setLoading(true);
      const response = await transportsApi.get(parseInt(transportId));
      const transport = response.data;
      
      if (!transport) {
        throw new Error('Transport not found');
      }
      
      setFormData({
        code: transport.code || "",
        code1: transport.code1 || "",
        name: transport.name || "",
        type: transport.type || "airline",
        status: transport.status || "on",
        image: transport.image || "",
      });
      
      if (transport.image) {
        setImagePreview(transport.image);
      }
    } catch (error) {
      console.error("Failed to load transport:", error);
      alert("ไม่สามารถโหลดข้อมูลได้");
      router.push("/dashboard/transports");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อ";
    }

    if (!formData.type) {
      newErrors.type = "กรุณาเลือกประเภท";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Update transport data
      await transportsApi.update(parseInt(transportId), {
        code: formData.code || undefined,
        code1: formData.code1 || undefined,
        name: formData.name,
        type: formData.type as "airline" | "bus" | "van" | "boat",
        status: formData.status as "on" | "off",
        image: formData.image || undefined,
      });

      // Upload new image if selected
      if (imageFile) {
        setUploadingImage(true);
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);
        
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transports/${transportId}/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: imageFormData,
          }
        );
        setUploadingImage(false);
      }

      alert("บันทึกข้อมูลเรียบร้อย");
      router.push("/dashboard/transports");
    } catch (error: any) {
      console.error("Failed to update transport:", error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/transports")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold">แก้ไขขนส่ง</h1>
        <p className="text-muted-foreground">แก้ไขข้อมูลการขนส่ง</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>ข้อมูลขนส่ง</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">รหัส IATA</label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="เช่น TG, WE"
                  maxLength={10}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="code1" className="block text-sm font-medium text-gray-700">รหัส ICAO</label>
                <Input
                  id="code1"
                  value={formData.code1}
                  onChange={(e) => handleInputChange("code1", e.target.value)}
                  placeholder="เช่น THA, THD"
                  maxLength={10}
                />
                {errors.code1 && (
                  <p className="text-sm text-red-500">{errors.code1}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="เช่น Thai Airways, Nok Air"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {Object.entries(TRANSPORT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="status"
                checked={formData.status === "on"}
                onChange={(e) =>
                  handleInputChange("status", e.target.checked ? "on" : "off")
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="status" className="text-sm font-medium text-gray-700">เปิดใช้งาน</label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">รูปภาพ</label>
              <div className="flex flex-col gap-4">
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-white">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-xs text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <span className="text-sm text-gray-500">
                    หรือ
                  </span>
                </div>
                <Input
                  placeholder="URL รูปภาพ (เว้นว่างถ้าอัปโหลดไฟล์)"
                  value={formData.image}
                  onChange={(e) => {
                    handleInputChange("image", e.target.value);
                    if (e.target.value) {
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }
                  }}
                />
              </div>
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving || uploadingImage}
                className="flex-1"
              >
                {saving || uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingImage ? "กำลังอัปโหลดรูป..." : "กำลังบันทึก..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึก
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/transports")}
                disabled={saving}
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
