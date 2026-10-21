using DevTaskHub.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<GitHubAccount> GitHubAccounts => Set<GitHubAccount>();
    public DbSet<TaskPullRequest> TaskPullRequests => Set<TaskPullRequest>();
    public DbSet<TaskActivityLog> TaskActivityLogs => Set<TaskActivityLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ApplyConfigurations(modelBuilder);
        SeedInitialAdmin(modelBuilder);
    }

    private static void ApplyConfigurations(ModelBuilder b)
    {
        // ---------- Users ----------
        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Role).HasMaxLength(20).HasConversion<string>().IsRequired();
            e.Property(x => x.IsActive).IsRequired();
        });

        // ---------- Projects ----------
        b.Entity<Project>(e =>
        {
            e.ToTable("Projects");
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.Status).HasMaxLength(20).HasConversion<string>().IsRequired();
            e.Property(x => x.UpdatedAtUtc).IsRequired();
            e.HasOne(x => x.Owner)
             .WithMany()
             .HasForeignKey(x => x.OwnerUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- ProjectMembers ----------
        b.Entity<ProjectMember>(e =>
        {
            e.ToTable("ProjectMembers");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ProjectId, x.UserId }).IsUnique();
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.Project)
             .WithMany(p => p.Members)
             .HasForeignKey(x => x.ProjectId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Tasks ----------
        b.Entity<TaskItem>(e =>
        {
            e.ToTable("Tasks");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(4000);
            e.Property(x => x.Status).HasMaxLength(20).HasConversion<string>().IsRequired();
            e.Property(x => x.Priority).HasMaxLength(10).HasConversion<string>().IsRequired();
            e.Property(x => x.DueDateUtc);
            e.HasIndex(x => new { x.ProjectId, x.Status });
            e.HasIndex(x => new { x.AssigneeUserId, x.Status });
            e.HasIndex(x => x.DueDateUtc);
            e.HasOne(x => x.Project)
             .WithMany(p => p.Tasks)
             .HasForeignKey(x => x.ProjectId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Assignee)
             .WithMany()
             .HasForeignKey(x => x.AssigneeUserId)
             .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.CreatedBy)
             .WithMany()
             .HasForeignKey(x => x.CreatedByUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- GitHubAccounts ----------
        b.Entity<GitHubAccount>(e =>
        {
            e.ToTable("GitHubAccounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.GitHubUsername).HasMaxLength(100).IsRequired();
            e.Property(x => x.DisplayName).HasMaxLength(150);
            e.Property(x => x.AvatarUrl).HasMaxLength(500);
            e.Property(x => x.ProfileUrl).HasMaxLength(500);
            e.HasIndex(x => x.UserId).IsUnique();          // one GitHub profile per user
            e.HasOne(x => x.User)
             .WithOne(u => u.GitHubAccount)
             .HasForeignKey<GitHubAccount>(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- TaskPullRequests ----------
        b.Entity<TaskPullRequest>(e =>
        {
            e.ToTable("TaskPullRequests");
            e.HasKey(x => x.Id);
            e.Property(x => x.RepositoryOwner).HasMaxLength(100).IsRequired();
            e.Property(x => x.RepositoryName).HasMaxLength(100).IsRequired();
            e.Property(x => x.HtmlUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.GitHubState).HasMaxLength(20).HasConversion<string>().IsRequired();
            e.Property(x => x.ReviewStatus).HasMaxLength(30).HasConversion<string>();
            e.Property(x => x.SyncError).HasMaxLength(500);
            e.HasIndex(x => new { x.RepositoryOwner, x.RepositoryName, x.PullRequestNumber }).IsUnique();
            e.HasIndex(x => x.TaskId);
            e.HasOne(x => x.Task)
             .WithMany(t => t.PullRequests)
             .HasForeignKey(x => x.TaskId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- TaskActivityLogs ----------
        b.Entity<TaskActivityLog>(e =>
        {
            e.ToTable("TaskActivityLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).HasMaxLength(50).HasConversion<string>().IsRequired();
            e.Property(x => x.OldValue).HasMaxLength(200);
            e.Property(x => x.NewValue).HasMaxLength(200);
            e.Property(x => x.Note).HasMaxLength(1000);
            e.HasIndex(x => new { x.TaskId, x.CreatedAtUtc });
            e.HasIndex(x => new { x.ProjectId, x.CreatedAtUtc });

            e.HasOne(x => x.Task)
             .WithMany(t => t.ActivityLogs)
             .HasForeignKey(x => x.TaskId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Project)
             .WithMany()
             .HasForeignKey(x => x.ProjectId)
             .OnDelete(DeleteBehavior.NoAction);
           
            e.HasOne(x => x.Actor)
             .WithMany()
             .HasForeignKey(x => x.ActorUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- RefreshTokens ----------
        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("RefreshTokens");
            e.HasKey(x => x.Id);
            e.Property(x => x.TokenHash).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.User)
             .WithMany(u => u.RefreshTokens)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ReplacedByToken)
             .WithMany()
             .HasForeignKey(x => x.ReplacedByTokenId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void SeedInitialAdmin(ModelBuilder b)
    {
        // Placeholder seed — replaced in Phase 3 with a properly hashed password.
        b.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "admin@devtaskhub.com",
            PasswordHash = "Nilesh",
            FullName = "Initial Admin",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}