'use client';

import { useUserMutations } from "@/hooks/use-firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface User {
  id?: string;
  storeId?: string;
  branch?: string;
  region?: string;
  province?: string;
  city?: string;
  lessor?: string;
  mallName?: string;
}

const userSchema = z.object({
  storeId: z.string().optional(),
  branch: z.string().optional(),
  region: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  lessor: z.string().optional(),
  mallName: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface AdminUserFormProps {
  user: User;
  onSave: () => void;
}

export function AdminUserForm({ user, onSave }: AdminUserFormProps) {
  const { updateUser } = useUserMutations();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      storeId: user.storeId || "",
      branch: user.branch || "",
      region: user.region || "",
      province: user.province || "",
      city: user.city || "",
      lessor: user.lessor || "",
      mallName: user.mallName || "",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    if (user.id) {
      await updateUser(user.id, data);
    }
    onSave();
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit User Details</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
          <input
            {...register("storeId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Store ID"
          />
          {errors.storeId && <p className="text-red-500 text-xs mt-1">{errors.storeId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <input
            {...register("branch")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Branch"
          />
          {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
          <input
            {...register("region")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Region"
          />
          {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
          <input
            {...register("province")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Province"
          />
          {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            {...register("city")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter City"
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lessor</label>
          <input
            {...register("lessor")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Lessor"
          />
          {errors.lessor && <p className="text-red-500 text-xs mt-1">{errors.lessor.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mall Name</label>
          <input
            {...register("mallName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Mall Name"
          />
          {errors.mallName && <p className="text-red-500 text-xs mt-1">{errors.mallName.message}</p>}
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}