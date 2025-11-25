# 🤝 Panduan Kontribusi

Terima kasih atas minat Anda untuk berkontribusi pada Website OSIS SMK Informatika Fithrah Insani! Kami sangat menghargai setiap kontribusi dari komunitas.

---

## 📋 Daftar Isi

- [Code of Conduct](#-code-of-conduct)
- [Cara Berkontribusi](#-cara-berkontribusi)
- [Development Setup](#-development-setup)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Testing](#-testing)
- [Documentation](#-documentation)

---

## 📜 Code of Conduct

### Our Pledge

Kami berkomitmen untuk membuat partisipasi dalam proyek ini bebas dari harassment untuk semua orang, terlepas dari:
- Tingkat pengalaman
- Jenis kelamin dan identitas gender
- Orientasi seksual
- Disabilitas
- Penampilan pribadi
- Ukuran tubuh
- Ras atau etnisitas
- Usia
- Agama
- Kebangsaan

### Standards

**Perilaku yang Diharapkan:**

- ✅ Menggunakan bahasa yang ramah dan inklusif
- ✅ Menghormati sudut pandang dan pengalaman yang berbeda
- ✅ Menerima kritik konstruktif dengan baik
- ✅ Fokus pada yang terbaik untuk komunitas
- ✅ Menunjukkan empati terhadap anggota komunitas lain

**Perilaku yang Tidak Dapat Diterima:**

- ❌ Penggunaan bahasa atau citra yang bersifat seksual
- ❌ Trolling, komentar yang menghina/merendahkan
- ❌ Harassment publik atau pribadi
- ❌ Mempublikasikan informasi pribadi orang lain tanpa izin
- ❌ Perilaku tidak profesional atau tidak pantas lainnya

---

## 🚀 Cara Berkontribusi

Ada banyak cara untuk berkontribusi:

### 1. 🐛 Melaporkan Bug

Jika menemukan bug:

1. **Check existing issues** - pastikan bug belum dilaporkan
2. **Create new issue** dengan informasi:
   - Deskripsi jelas tentang bug
   - Steps to reproduce
   - Expected behavior vs actual behavior
   - Screenshots (jika ada)
   - Environment info (browser, OS, dll)

**Template Bug Report:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 11]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### 2. 💡 Mengusulkan Fitur Baru

Punya ide untuk fitur baru?

1. **Check roadmap** - lihat apakah fitur sudah direncanakan
2. **Create feature request issue**
3. **Diskusikan** dengan maintainers sebelum mulai coding

**Template Feature Request:**

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, screenshots, etc.
```

### 3. 📝 Memperbaiki Dokumentasi

- Typo fixes
- Clarity improvements
- New examples
- Translation

### 4. 💻 Kontribusi Code

- Bug fixes
- New features
- Performance improvements
- Refactoring

---

## 🛠 Development Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Git
- VS Code (recommended)

### Initial Setup

```bash
# 1. Fork repository di GitHub
# Click tombol "Fork" di repo page

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/webosis-archive.git
cd webosis-archive

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/webosis-archive.git

# 4. Install dependencies
npm install

# 5. Setup environment
cp .env.example .env.local
# Edit .env.local dengan kredensial Anda

# 6. Run development server
npm run dev
```

### Development Workflow

```bash
# 1. Sync dengan upstream
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes dan test
npm run dev

# 4. Run linter
npm run lint

# 5. Commit changes
git add .
git commit -m "Add: amazing feature"

# 6. Push to your fork
git push origin feature/amazing-feature

# 7. Create Pull Request di GitHub
```

---

## 📏 Coding Standards

### TypeScript

- **Strict mode enabled** - always
- **Type everything** - no `any` unless absolutely necessary
- **Interfaces over types** untuk object shapes
- **Enums** untuk konstanta yang related

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
};

// ❌ Bad
const user: any = {
  id: '123',
  name: 'John Doe',
};
```

### React Components

- **Functional components** dengan hooks
- **Named exports** untuk components
- **Props interface** untuk type safety
- **Destructure props** di parameter

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad
export default function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### File Naming

- **Components:** PascalCase - `UserProfile.tsx`
- **Utilities:** camelCase - `formatDate.ts`
- **Constants:** UPPER_SNAKE_CASE - `API_ENDPOINTS.ts`
- **Hooks:** camelCase with `use` prefix - `useAuth.ts`

### Folder Structure

```
app/
├── (routes)/           # Route groups
│   ├── about/
│   ├── admin/
│   └── ...
├── api/                # API routes
├── layout.tsx          # Root layout
└── page.tsx            # Homepage

components/
├── ui/                 # Reusable UI components
├── admin/              # Admin-specific
└── ...                 # Feature components

lib/
├── utils.ts            # Utility functions
├── validators.ts       # Zod schemas
└── constants.ts        # Constants
```

### CSS/Tailwind

- **Use Tailwind classes** over custom CSS when possible
- **Consistent spacing** - use Tailwind's spacing scale
- **Mobile-first** approach
- **Dark mode** support

```tsx
// ✅ Good
<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>
</div>

// ❌ Bad - custom styles everywhere
<div style={{ padding: '16px', backgroundColor: 'white' }}>
  <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Title</h1>
</div>
```

### Code Formatting

We use ESLint for linting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

**Key Rules:**

- 2 spaces for indentation
- Single quotes for strings
- Semicolons at end of statements
- Trailing commas in objects/arrays
- Max line length: 100 characters

---

## 📝 Commit Guidelines

Kami menggunakan **Conventional Commits** format:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI configuration changes

### Examples

```bash
# Feature
git commit -m "feat(gallery): add infinite scroll pagination"

# Bug fix
git commit -m "fix(auth): resolve login redirect issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple changes
git commit -m "feat(admin): add member management dashboard

- Add member list with search and filter
- Implement member CRUD operations
- Add member photo upload
- Update member interface types

Closes #123"
```

### Rules

- ✅ Use imperative mood ("add" not "added")
- ✅ Don't capitalize first letter
- ✅ No period at the end
- ✅ Keep subject line under 72 characters
- ✅ Reference issues/PRs in footer

---

## 🔄 Pull Request Process

### Before Creating PR

1. **Update your branch** dengan upstream main
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run build
   ```

3. **Test locally**
   - Manual testing
   - Check all changed features
   - Test on different browsers/devices

### Creating Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

2. **Open PR on GitHub**
   - Go to original repository
   - Click "New Pull Request"
   - Select your branch

3. **Fill PR Template**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes locally

## Related Issues
Closes #123
```

### Review Process

1. **Maintainer reviews** your PR
2. **Address feedback** if requested
3. **Update PR** dengan changes
4. **Approval** dari maintainer
5. **Merge** ke main branch

### After Merge

```bash
# Update your local main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

---

## 🧪 Testing

### Manual Testing

Test checklist untuk features baru:

- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Different screen sizes
- [ ] Dark mode
- [ ] Keyboard navigation
- [ ] Screen reader compatibility (optional)

### Testing Tips

```bash
# Test production build locally
npm run build
npm start

# Test on network devices
npm run dev:fast
# Access from phone using shown network URL
```

---

## 📖 Documentation

### Code Comments

```typescript
// ✅ Good - explains WHY
// Using memoization here to prevent expensive recalculation
// when component re-renders due to parent state changes
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// ❌ Bad - states the obvious
// This function adds two numbers
function add(a: number, b: number) {
  return a + b;
}
```

### JSDoc for Complex Functions

```typescript
/**
 * Fetches user data from Supabase and transforms it for display
 * 
 * @param userId - The unique identifier of the user
 * @param includeMetadata - Whether to include additional metadata
 * @returns Promise resolving to transformed user data
 * @throws {Error} If user not found or database error occurs
 * 
 * @example
 * const user = await fetchUserData('123', true);
 * console.log(user.name);
 */
async function fetchUserData(
  userId: string,
  includeMetadata = false
): Promise<TransformedUser> {
  // Implementation
}
```

### README Updates

Jika PR Anda menambah fitur baru:

- Update README.md dengan dokumentasi fitur
- Add usage examples
- Update screenshots jika UI berubah

---

## 🏆 Recognition

Contributors akan:

- ✅ Listed di README.md
- ✅ Mentioned dalam release notes
- ✅ Given credit di About page (untuk kontribusi significant)

---

## ❓ Questions?

Ada pertanyaan? Jangan ragu untuk:

- 💬 Open a discussion di GitHub Discussions
- 📧 Email: osis@smaitfi.sch.id
- 💡 Ask di issue comments

---

## 📜 License

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah MIT License yang sama dengan proyek ini.

---

<div align="center">

**Thank you for contributing! 🙏**

*Together we make it better!*

</div>
