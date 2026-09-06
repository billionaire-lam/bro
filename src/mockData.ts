import type { ActivityLogEntry, Notification, Quiz, Student, Template } from './types';

export const SUBJECT_NAMES = ['Toán 8', 'Ngữ văn 8', 'Tiếng Anh 8', 'Lịch sử 8', 'Khoa học tự nhiên 8'];

export const mockQuizzes: Quiz[] = [
  { id: 'q1', name: 'Quiz: Hàm số bậc nhất', subjectId: 'Toán 8', questionCount: 10, status: 'published' },
  { id: 'q2', name: 'Quiz: Phân thức đại số', subjectId: 'Toán 8', questionCount: 15, status: 'published' },
  { id: 'q3', name: 'Quiz: Văn học hiện đại', subjectId: 'Ngữ văn 8', questionCount: 8, status: 'draft' },
  { id: 'q4', name: 'Quiz: My Hobbies', subjectId: 'Tiếng Anh 8', questionCount: 12, status: 'published' },
  { id: 'q5', name: 'Quiz: Thời phong kiến', subjectId: 'Lịch sử 8', questionCount: 10, status: 'draft' },
  { id: 'q6', name: 'Quiz: Vật chất và sự sống', subjectId: 'Khoa học tự nhiên 8', questionCount: 14, status: 'published' },
];

export const mockTemplates: Template[] = [
  { id: 't1', name: 'Giới thiệu sách', description: 'Template thuyết trình giới thiệu một cuốn sách', subjectId: 'Ngữ văn 8', thumbnail: 'books', fileName: 'gioi-thieu-sach.pptx', status: 'published' },
  { id: 't2', name: 'Hàm số và đồ thị', description: 'Template trực quan hóa hàm số bậc nhất', subjectId: 'Toán 8', thumbnail: 'math', fileName: 'ham-so-do-thi.pptx', status: 'published' },
  { id: 't3', name: 'Natural Wonders', description: 'Template về các kỳ quan thiên nhiên', subjectId: 'Tiếng Anh 8', thumbnail: 'nature', fileName: 'natural-wonders.pptx', status: 'published' },
  { id: 't4', name: 'Thí nghiệm vật lý', description: 'Template trình bày thí nghiệm khoa học', subjectId: 'Khoa học tự nhiên 8', thumbnail: 'science', fileName: 'thi-nghiem-vat-ly.pdf', status: 'draft' },
  { id: 't5', name: 'Dòng chảy lịch sử', description: 'Template về các triều đại phong kiến', subjectId: 'Lịch sử 8', thumbnail: 'history', fileName: 'dong-chay-lich-su.pptx', status: 'published' },
  { id: 't6', name: 'Phân thức đại số', description: 'Template giảng dạy phân thức', subjectId: 'Toán 8', thumbnail: 'algebra', fileName: 'phan-thuc-dai-so.pptx', status: 'draft' },
];

export const mockStudents: Student[] = [
  { id: 'st1', name: 'Trần Gia Bảo', email: 'giabao.tran@studyhub.vn', subject: 'Toán 8', progress: 78, streak: 12, status: 'active', joinDate: '15/01/2024', recentActivity: [{ action: 'Hoàn thành Quiz: Hàm số bậc nhất', time: '2 giờ trước' }, { action: 'Học bài: Khái niệm phân thức', time: '5 giờ trước' }, { action: 'Tham gia khóa Toán 8', time: 'Hôm qua' }] },
  { id: 'st2', name: 'Lê Khánh Linh', email: 'khanhlinh.le@studyhub.vn', subject: 'Ngữ văn 8', progress: 65, streak: 8, status: 'active', joinDate: '22/01/2024', recentActivity: [{ action: 'Đăng bài thuyết trình: Giới thiệu sách', time: '1 giờ trước' }, { action: 'Học bài: Vẻ đẹp ca dao', time: 'Hôm qua' }] },
  { id: 'st3', name: 'Phạm Hoàng Nam', email: 'hoangnam.pham@studyhub.vn', subject: 'Toán 8', progress: 42, streak: 3, status: 'active', joinDate: '03/02/2024', recentActivity: [{ action: 'Tham gia khóa Toán 8 - Chương 3', time: 'Hôm qua' }, { action: 'Hoàn thành Quiz: Phân thức', time: '2 ngày trước' }] },
  { id: 'st4', name: 'Đặng Thu Hà', email: 'thuha.dang@studyhub.vn', subject: 'Tiếng Anh 8', progress: 82, streak: 21, status: 'active', joinDate: '10/01/2024', recentActivity: [{ action: 'Gửi câu hỏi AI: Hàm số bậc hai', time: 'Hôm qua' }, { action: 'Hoàn thành Lesson 1', time: '2 ngày trước' }] },
  { id: 'st5', name: 'Vũ Minh Quân', email: 'minhquan.vu@studyhub.vn', subject: 'Lịch sử 8', progress: 54, streak: 0, status: 'inactive', joinDate: '18/02/2024', recentActivity: [{ action: 'Học bài: Thời phong kiến', time: '5 ngày trước' }] },
  { id: 'st6', name: 'Bạch Thu Trang', email: 'thutrang.bach@studyhub.vn', subject: 'Khoa học tự nhiên 8', progress: 47, streak: 5, status: 'active', joinDate: '28/01/2024', recentActivity: [{ action: 'Hoàn thành Quiz: Vật chất', time: '3 giờ trước' }, { action: 'Học bài: Thí nghiệm vật lý', time: 'Hôm qua' }] },
  { id: 'st7', name: 'Ngô Đức Anh', email: 'ducanh.ngo@studyhub.vn', subject: 'Tiếng Anh 8', progress: 91, streak: 18, status: 'active', joinDate: '05/01/2024', recentActivity: [{ action: 'Hoàn thành Quiz: My Hobbies', time: '1 giờ trước' }, { action: 'Học Lesson 1: Getting Started', time: 'Hôm qua' }] },
  { id: 'st8', name: 'Hoàng Thị Mai', email: 'thimai.hoang@studyhub.vn', subject: 'Ngữ văn 8', progress: 33, streak: 0, status: 'inactive', joinDate: '12/03/2024', recentActivity: [{ action: 'Đăng nhập hệ thống', time: '1 tuần trước' }] },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Thông báo nghỉ lễ 2/9', content: 'Hệ thống sẽ tạm dừng cập nhật bài giảng trong ngày 2/9. Học sinh vẫn truy cập bình thường.', audience: 'Tất cả', date: '28/08/2024', status: 'published' },
  { id: 'n2', title: 'Quiz mới: Hàm số bậc nhất', content: 'Quiz mới đã được thêm vào chương Hàm số và đồ thị. Vui lòng hoàn thành trong tuần này.', audience: 'Học sinh', date: '26/08/2024', status: 'published' },
  { id: 'n3', title: 'Cập nhật nội dung Toán 8', content: 'Chương mới về phân thức đại số đã được xuất bản.', audience: 'Học sinh', date: '25/08/2024', status: 'draft' },
  { id: 'n4', title: 'Hướng dẫn sử dụng AI Tools', content: 'Giáo viên có thể sử dụng AI Tools để tạo bài giảng và quiz nhanh hơn.', audience: 'Giáo viên', date: '20/08/2024', status: 'published' },
];

export const mockActivityLog: ActivityLogEntry[] = [
  { id: 'a1', actor: 'Nguyễn Minh', action: 'Tạo bài giảng mới', target: 'Bài 12: Phân thức đại số', time: '18/05/2024 10:30', type: 'create' },
  { id: 'a2', actor: 'Trần Gia Bảo', action: 'Hoàn thành quiz', target: 'Quiz: Hàm số bậc nhất', time: '18/05/2024 09:15', type: 'create' },
  { id: 'a3', actor: 'Nguyễn Minh', action: 'Xuất bản bài giảng', target: 'Unit 5: Natural wonders', time: '15/05/2024 14:20', type: 'publish' },
  { id: 'a4', actor: 'Lê Khánh Linh', action: 'Cập nhật template', target: 'Giới thiệu sách', time: '15/05/2024 08:45', type: 'update' },
  { id: 'a5', actor: 'Phạm Hoàng Nam', action: 'Tham gia khóa học', target: 'Toán 8 - Chương 3', time: '14/05/2024 16:10', type: 'create' },
  { id: 'a6', actor: 'Nguyễn Minh', action: 'Xóa bài giảng', target: 'Bài cũ: Quy đồng mẫu', time: '14/05/2024 11:00', type: 'delete' },
  { id: 'a7', actor: 'Đặng Thu Hà', action: 'Đăng nhập hệ thống', target: '', time: '13/05/2024 07:30', type: 'login' },
  { id: 'a8', actor: 'Nguyễn Minh', action: 'Cập nhật môn học', target: 'Toán 8', time: '12/05/2024 15:00', type: 'update' },
  { id: 'a9', actor: 'Bạch Thu Trang', action: 'Hoàn thành quiz', target: 'Quiz: Vật chất và sự sống', time: '12/05/2024 09:00', type: 'create' },
  { id: 'a10', actor: 'Nguyễn Minh', action: 'Xuất bản quiz', target: 'Quiz: My Hobbies', time: '11/05/2024 17:25', type: 'publish' },
];
