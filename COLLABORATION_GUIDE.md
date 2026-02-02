# Collaboration Guide for AI-Based Crop Recommendation System

## Setup for Two People Working Together

### Method 1: Direct Collaboration (Recommended)

#### Repository Owner Setup:
1. Go to GitHub repository: https://github.com/16Nidhi/AI-Based-Crop-Recommendation-System-
2. Click **Settings** → **Manage access** → **Invite a collaborator**
3. Enter collaborator's GitHub username
4. Send invitation

#### Collaborator Setup:
1. Accept invitation from email/GitHub
2. Clone repository:
```bash
git clone https://github.com/16Nidhi/AI-Based-Crop-Recommendation-System-.git
cd AI-Based-Crop-Recommendation-System-
```

### Daily Workflow

#### Before Starting Work (ALWAYS DO THIS):
```bash
git pull origin main
```

#### After Making Changes:
```bash
git add .
git commit -m "Description of your changes"
git push origin main
```

### Working on Different Features Simultaneously

#### Create Feature Branches:
```bash
# Create and switch to new branch
git checkout -b feature-name

# Work on your feature
# Make changes to files

# Commit changes
git add .
git commit -m "Feature description"

# Push branch to GitHub
git push origin feature-name

# Create Pull Request on GitHub website
# Merge after review
```

### Handling Conflicts

When both people edit the same file:
1. Git will show conflict when you pull/push
2. Open conflicted files
3. Look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Other person's changes
   >>>>>>> branch-name
   ```
4. Edit file to keep what you want
5. Remove conflict markers
6. Save file
7. Commit:
   ```bash
   git add .
   git commit -m "Resolve merge conflict"
   git push origin main
   ```

### Best Practices

1. **Communicate**: Use GitHub Issues or comments to discuss who works on what
2. **Pull often**: Always `git pull` before starting work
3. **Commit frequently**: Small, frequent commits are better than large ones
4. **Use branches**: For major features, use separate branches
5. **Test before pushing**: Make sure your changes work before pushing

### File Organization for Collaboration

- **web-app/**: Frontend development
- **mobile-app/**: Android/mobile development
- **README.md**: Project documentation
- **COLLABORATION_GUIDE.md**: This guide

### Common Commands Reference

```bash
# Check status
git status

# See what changed
git diff

# View commit history
git log --oneline

# Switch branches
git checkout branch-name

# Create new branch
git checkout -b new-branch-name

# Merge branch
git checkout main
git merge branch-name

# Delete branch
git branch -d branch-name
```

## Quick Start Checklist

- [ ] Repository owner adds collaborator
- [ ] Collaborator accepts invitation
- [ ] Both people clone repository
- [ ] Test: Both people can push/pull changes
- [ ] Agree on workflow (direct collaboration vs branches)
- [ ] Start working and stay synchronized!