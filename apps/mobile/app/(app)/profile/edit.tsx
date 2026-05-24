import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
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

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(60),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
  ministry: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
});
type EditProfileInput = z.infer<typeof editProfileSchema>;

export default function EditProfileScreen() {
  const qc = useQueryClient();
  const { refreshUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: ({ signal }) => api.profile.me(signal),
  });

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    values: {
      fullName: profile?.fullName  ?? "",
      bio:      profile?.bio       ?? "",
      ministry: profile?.ministry  ?? "",
      phone:    profile?.phone     ?? "",
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

  async function handleChangePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access to your photos in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    Toast.show({ type: "info", text1: "Photo upload", text2: "Photo uploads enabled in next update." });
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: COLORS.bg.page }]}>
        <Skeleton width="100%" height={56} />
        <Skeleton width="100%" height={100} />
        <Skeleton width="100%" height={56} />
        <Skeleton width="100%" height={56} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.page }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar picker */}
      <View style={styles.avatarWrap}>
        <View>
          <Avatar uri={profile?.photoUrl} name={profile?.fullName} size={96} />
          <TouchableOpacity
            onPress={handleChangePhoto}
            accessibilityLabel="Change profile photo"
            style={[styles.cameraBtn, { backgroundColor: COLORS.brand.primary, borderColor: COLORS.bg.page }]}
          >
            <Camera size={14} color={COLORS.bg.page} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: COLORS.brand.primary, fontSize: 14, fontWeight: "500", marginTop: 8 }}>
          Change photo
        </Text>
      </View>

      {/* Form fields */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Full name" placeholder="Your full name" autoCapitalize="words"
              textContentType="name" onChangeText={onChange} onBlur={onBlur} value={value}
              error={errors.fullName?.message} />
          )}
        />
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Bio" placeholder="Tell the community about yourself…" multiline
              numberOfLines={4} autoCapitalize="sentences" onChangeText={onChange}
              onBlur={onBlur} value={value ?? ""} error={errors.bio?.message}
              hint={`${(value ?? "").length}/300`} />
          )}
        />
        <Controller
          control={control}
          name="ministry"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Ministry / department" placeholder="e.g. Worship team, Ushers…"
              autoCapitalize="words" onChangeText={onChange} onBlur={onBlur}
              value={value ?? ""} error={errors.ministry?.message} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Phone number" placeholder="+234 800 000 0000" keyboardType="phone-pad"
              textContentType="telephoneNumber" onChangeText={onChange} onBlur={onBlur}
              value={value ?? ""} error={errors.phone?.message} />
          )}
        />
      </View>

      <Button size="lg" loading={saving} disabled={!isDirty}
        onPress={handleSubmit((d) => save(d))} style={{ marginTop: 24 }}>
        Save changes
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: 16,
  },
});
