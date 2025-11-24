# GitHub 上传指南

## 快速上传到 GitHub

### 1. 初始化 Git 仓库（如果还没有）

```bash
git init
```

### 2. 添加所有文件

```bash
git add .
```

### 3. 提交更改

```bash
git commit -m "Initial commit: SNAP-IV 问卷应用"
```

### 4. 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库名称（如 `adhd-snap-quiz`）
3. 选择 Public 或 Private
4. **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
5. 点击 "Create repository"

### 5. 连接远程仓库并推送

GitHub 会显示命令，类似这样：

```bash
# 添加远程仓库（替换为你的用户名和仓库名）
git remote add origin https://github.com/your-username/adhd-snap-quiz.git

# 或者使用 SSH（如果你配置了 SSH key）
git remote add origin git@github.com:your-username/adhd-snap-quiz.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 后续更新

当你修改代码后：

```bash
git add .
git commit -m "描述你的更改"
git push
```

## 注意事项

- `.gitignore` 已经配置好了，会自动忽略 `node_modules/` 和 `dist/` 等文件
- 确保不要提交敏感信息（如 API keys）
- 建议在 GitHub 上添加 `.github/workflows` 用于 CI/CD（可选）

