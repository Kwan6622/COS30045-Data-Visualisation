import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import numpy as np

# Định nghĩa các bảng màu an toàn cho người mù màu dùng cho bản đồ tội phạm
palettes = {
    "1. Orange -> Red -> Purple (Khuyên dùng)": ['#FEE6D9', '#FCA289', '#F55B4B', '#C51B7D', '#67001F'],
    "2. Yellow -> Orange -> Red (YlOrRd)": ['#FFFFCC', '#FED976', '#FEB24C', '#FC4E2A', '#B10026'],
    "3. Viridis (Tiêu chuẩn đồ họa khoa học)": ['#FDE725', '#7AD151', '#22A884', '#2A788E', '#440154'],
    "4. Sequential Purples (Đơn sắc tối giản)": ['#F2F0F7', '#CBC9E2', '#9E9AC8', '#756BB1', '#54278F']
}

# Khởi tạo khung chứa biểu đồ hiển thị bảng màu
fig, axes = plt.subplots(len(palettes), 1, figsize=(10, 6))
fig.suptitle("Crime Map Color Palettes (Color Blind Friendly)", fontsize=14, fontweight='bold')

for ax, (title, colors) in zip(axes, palettes.items()):
    n = len(colors)
    # Tạo ma trận gradient tượng trưng cho 5 cấp độ
    matrix = np.arange(n).reshape(1, n)
    cmap = mcolors.ListedColormap(colors)
    
    # Hiển thị dải màu
    ax.imshow(matrix, cmap=cmap, aspect='auto')
    
    # Gắn nhãn HEX cho từng ô màu
    ax.set_xticks(range(n))
    ax.set_xticklabels([f"Mức {i+1}\n{colors[i]}" for i in range(n)], fontsize=9)
    ax.set_yticks([])
    ax.set_title(title, loc='left', fontsize=11, fontweight='bold', pad=8)
    
    # Ẩn các đường viền bao quanh không cần thiết
    for spine in ax.spines.values():
        spine.set_visible(False)

plt.tight_layout()
print("Đang hiển thị bảng màu... Hãy đóng cửa sổ đồ họa để hoàn tất tập lệnh.")
plt.show()
