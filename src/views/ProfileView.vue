<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1>个人资料</h1>

      <div class="profile-info">
        <div class="avatar-section">
          <div class="avatar">
            <img v-if="profile?.avatar_url" :src="profile.avatar_url" alt="头像" />
            <div v-else class="avatar-placeholder">
              {{ getInitials(profile?.full_name || profile?.username || 'U') }}
            </div>
          </div>
          <button @click="showAvatarUpload = true" class="upload-btn">
            更换头像
          </button>
        </div>

        <div class="info-section">
          <div class="info-item">
            <label>邮箱</label>
            <span>{{ authStore.user?.email }}</span>
          </div>

          <div class="info-item">
            <label>用户名</label>
            <input v-model="editForm.username" type="text" :disabled="!editing" class="info-input" />
          </div>

          <div class="info-item">
            <label>姓名</label>
            <input v-model="editForm.full_name" type="text" :disabled="!editing" class="info-input" />
          </div>

          <div class="info-item">
            <label>注册时间</label>
            <span>{{ formatDate(authStore.user?.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button v-if="!editing" @click="startEdit" class="edit-btn">
          编辑资料
        </button>
        <template v-else>
          <button @click="saveProfile" :disabled="saving" class="save-btn">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button @click="cancelEdit" class="cancel-btn">
            取消
          </button>
        </template>

        <button @click="handleSignOut" class="signout-btn">
          退出登录
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </div>

    <!-- 头像上传模态框 -->
    <div v-if="showAvatarUpload" class="modal-overlay" @click="showAvatarUpload = false">
      <div class="modal-content" @click.stop>
        <h2>上传头像</h2>
        <input type="file" accept="image/*" @change="handleAvatarUpload" class="file-input" />
        <div class="modal-actions">
          <button @click="showAvatarUpload = false" class="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase, type Profile } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const profile = ref<Profile | null>(null)
const editing = ref(false)
const saving = ref(false)
const showAvatarUpload = ref(false)
const error = ref('')
const success = ref('')

const editForm = reactive({
  username: '',
  full_name: ''
})

onMounted(async () => {
  await fetchProfile()
})

const fetchProfile = async () => {
  if (!authStore.user) return

  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    profile.value = data
    if (data) {
      editForm.username = data.username || ''
      editForm.full_name = data.full_name || ''
    }
  } catch (err: any) {
    error.value = '获取资料失败: ' + err.message
  }
}

const startEdit = () => {
  editing.value = true
  error.value = ''
  success.value = ''
}

const cancelEdit = () => {
  editing.value = false
  if (profile.value) {
    editForm.username = profile.value.username || ''
    editForm.full_name = profile.value.full_name || ''
  }
}

const saveProfile = async () => {
  if (!authStore.user) return

  saving.value = true
  error.value = ''
  success.value = ''

  try {
    const { data, error: saveError } = await supabase
      .from('profiles')
      .upsert({
        id: authStore.user.id,
        username: editForm.username,
        full_name: editForm.full_name,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) throw saveError

    profile.value = data
    editing.value = false
    success.value = '资料更新成功！'
  } catch (err: any) {
    error.value = '保存失败: ' + err.message
  } finally {
    saving.value = false
  }
}

const handleAvatarUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !authStore.user) return

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${authStore.user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    await supabase
      .from('profiles')
      .upsert({
        id: authStore.user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })

    await fetchProfile()
    showAvatarUpload.value = false
    success.value = '头像更新成功！'
  } catch (err: any) {
    error.value = '头像上传失败: ' + err.message
  }
}

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    router.push('/auth')
  } catch (err: any) {
    error.value = '退出登录失败: ' + err.message
  }
}

const getInitials = (name: string) => {
  return name.charAt(0).toUpperCase()
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.profile-info {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 3rem;
  color: #aaa;
}

.upload-btn {
  background: none;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover {
  background: #f0f0f0;
  border-color: #aaa;
}

.info-section {
  flex: 1;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.info-item label {
  width: 100px;
  color: #555;
  font-weight: 500;
}

.info-item span {
  color: #333;
}

.info-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.info-input:disabled {
  background: #f9f9f9;
  border-color: #eee;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.edit-btn,
.save-btn,
.cancel-btn,
.signout-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.edit-btn {
  background: #2196F3;
  color: white;
}

.edit-btn:hover {
  background: #1976D2;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover {
  background: #45a049;
}

.cancel-btn {
  background: #f44336;
  color: white;
}

.cancel-btn:hover {
  background: #d32f2f;
}

.signout-btn {
  background: #607D8B;
  color: white;
  margin-left: auto;
}

.signout-btn:hover {
  background: #546E7A;
}

.error-message,
.success-message {
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
  text-align: center;
}

.error-message {
  background: #fee;
  color: #c33;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.modal-actions {
  margin-top: 1rem;
  text-align: right;
}

.file-input {
  width: 100%;
}
</style>
