import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { COLORS } from "@/lib/theme/colors";

// ── Form schema ────────────────────────────────────────────────────────────────
const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(60),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
  ministry: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
});

type EditProfileInput = z.infer<typeof editProfileSchema>;

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const qc = useQueryClient();
  const { refreshUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: ({ signal }) => api.profile.me(signal),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    values: {
      fullName: profile?.fullName ?? "",
      bio: profile?.bio ?? "",
      ministry: profile?.ministry ?? "",
      phone: profile?.phone ?? "",
    },
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data: EditProfileInput) => api.profile.updateMe(data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile", "me"] });
      await refreshUser();
      Toast.show({ type: "success", text1: "Profile updated!" });
      router.back();
    },
    onError: (e: Error) => {
      Toast.show({ type: "error", text1: "Update failed", text2: e.message });
    },
  });

  // ── Photo upload ─────────────────────────────────────────────────────────────
  async function handleChangePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow access to your photos in Settings to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    // Phase M2: photo upload wired for M3 (needs Cloudinary signed upload)
    Toast.show({
      type: "info",
      text1: "Photo upload",
      text2: "Photo uploads will be enabled in the next update.",
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-white px-5 pt-6 gap-y-4">
        <Skeleton width="100%" height={56} />
        <Skeleton width="100%" height={100} />
        <Skeleton width="100%" height={56} />
        <Skeleton width="100%" height={56} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar picker */}
      <View className="items-center mb-8">
        <View className="relative">
          <Avatar uri={profile?.photoUrl} name={profile?.fullName} size={96} />
          <TouchableOpacity
            onPress={handleChangePhoto}
            accessibilityLabel="Change profile photo"
            className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full items-center justify-center border-2 border-white"
          >
            <Camera size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text className="text-brand text-sm font-medium mt-2">
          Change photo
        </Text>
      </View>

      {/* Form fields */}
      <View className="gap-y-4">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              placeholder="Your full name"
              autoCapitalize="words"
              textContentType="name"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Bio"
              placeholder="Tell the community about yourself…"
              multiline
              numberOfLines={4}
              autoCapitalize="sentences"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ""}
              error={errors.bio?.message}
              hint={`${(value ?? "").length}/300`}
            />
          )}
        />

        <Controller
          control={control}
          name="ministry"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Ministry / department"
              placeholder="e.g. Worship team, Ushers…"
              autoCapitalize="words"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ""}
              error={errors.ministry?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone number"
              placeholder="+234 800 000 0000"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ""}
              error={errors.phone?.message}
            />
          )}
        />
      </View>

      <Button
        size="lg"
        loading={saving}
        disabled={!isDirty}
        onPress={handleSubmit((d) => save(d))}
        className="mt-6"
      >
        Save changes
      </Button>
    </ScrollView>
  );
}
