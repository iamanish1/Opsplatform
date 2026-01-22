const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function listProjects() {
  console.log('\n📋 Listing All Projects...\n');
  const projects = await prisma.project.findMany();

  if (projects.length === 0) {
    console.log('❌ No projects found in database.');
    return;
  }

  projects.forEach((project, index) => {
    console.log(`\n${index + 1}. ${project.title}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Description: ${project.description.substring(0, 80)}...`);
    console.log(`   Starter Repo: ${project.starterRepo}`);
    console.log(`   Tasks: ${JSON.parse(project.tasksJson).length} tasks`);
    console.log(`   Difficulty: ${project.difficulty || 'N/A'}`);
  });

  console.log(`\n✅ Total Projects: ${projects.length}\n`);
}

async function addProject() {
  console.log('\n➕ Adding New Project...\n');

  const title = await question('Project Title: ');
  const description = await question('Project Description: ');
  const starterRepo = await question('Starter Repository URL: ');
  const difficulty = await question('Difficulty Level (BEGINNER/INTERMEDIATE/ADVANCED): ');

  const taskCountStr = await question('Number of tasks: ');
  const taskCount = parseInt(taskCountStr) || 0;

  const tasks = [];
  let totalPoints = 0;

  for (let i = 0; i < taskCount; i++) {
    console.log(`\n  Task ${i + 1}:`);
    const taskTitle = await question('    Task Title: ');
    const taskDesc = await question('    Task Description: ');
    const taskPoints = parseInt(await question('    Task Points: ')) || 0;

    tasks.push({
      id: `task-${i + 1}`,
      title: taskTitle,
      description: taskDesc,
      points: taskPoints,
    });

    totalPoints += taskPoints;
  }

  try {
    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        starterRepo,
        difficulty: difficulty.toUpperCase() || 'INTERMEDIATE',
        tasksJson: JSON.stringify(tasks),
      },
    });

    console.log(`\n✅ Project created successfully!`);
    console.log(`   ID: ${newProject.id}`);
    console.log(`   Total Points: ${totalPoints}`);
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
  }
}

async function updateProject() {
  console.log('\n✏️ Updating Project...\n');

  const projectId = await question('Enter Project ID to update: ');

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.log('❌ Project not found.');
    return;
  }

  console.log(`\nFound Project: ${project.title}`);
  console.log('Leave field blank to keep existing value.\n');

  const title = await question(`Title [${project.title}]: `) || project.title;
  const description = await question(`Description [${project.description.substring(0, 50)}...]: `) || project.description;
  const starterRepo = await question(`Starter Repo [${project.starterRepo}]: `) || project.starterRepo;
  const difficulty = await question(`Difficulty [${project.difficulty}]: `) || project.difficulty;

  try {
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title,
        description,
        starterRepo,
        difficulty: difficulty.toUpperCase(),
      },
    });

    console.log(`\n✅ Project updated successfully!`);
    console.log(`   ID: ${updatedProject.id}`);
    console.log(`   Title: ${updatedProject.title}`);
  } catch (error) {
    console.error('❌ Error updating project:', error.message);
  }
}

async function deleteProject() {
  console.log('\n🗑️ Deleting Project...\n');

  const projectId = await question('Enter Project ID to delete: ');

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.log('❌ Project not found.');
    return;
  }

  console.log(`\nProject to delete: ${project.title}`);
  const confirm = await question('Are you sure? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Deletion cancelled.');
    return;
  }

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log(`\n✅ Project deleted successfully!`);
  } catch (error) {
    console.error('❌ Error deleting project:', error.message);
  }
}

async function updateProjectTasks() {
  console.log('\n📝 Updating Project Tasks...\n');

  const projectId = await question('Enter Project ID: ');

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.log('❌ Project not found.');
    return;
  }

  console.log(`\nProject: ${project.title}`);
  const currentTasks = JSON.parse(project.tasksJson);
  console.log(`Current Tasks: ${currentTasks.length}\n`);

  currentTasks.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.title} (${task.points} pts)`);
  });

  const action = await question('\nAction (add/remove/modify): ').toLowerCase();

  if (action === 'add') {
    console.log('\n➕ Adding new task...');
    const taskTitle = await question('Task Title: ');
    const taskDesc = await question('Task Description: ');
    const taskPoints = parseInt(await question('Task Points: ')) || 0;

    currentTasks.push({
      id: `task-${currentTasks.length + 1}`,
      title: taskTitle,
      description: taskDesc,
      points: taskPoints,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        tasksJson: JSON.stringify(currentTasks),
      },
    });

    console.log('✅ Task added successfully!');
  } else if (action === 'remove') {
    const indexStr = await question('Task number to remove: ');
    const index = parseInt(indexStr) - 1;

    if (index < 0 || index >= currentTasks.length) {
      console.log('❌ Invalid task number.');
      return;
    }

    const removed = currentTasks.splice(index, 1);
    await prisma.project.update({
      where: { id: projectId },
      data: {
        tasksJson: JSON.stringify(currentTasks),
      },
    });

    console.log(`✅ Task "${removed[0].title}" removed successfully!`);
  } else if (action === 'modify') {
    const indexStr = await question('Task number to modify: ');
    const index = parseInt(indexStr) - 1;

    if (index < 0 || index >= currentTasks.length) {
      console.log('❌ Invalid task number.');
      return;
    }

    const task = currentTasks[index];
    console.log(`\nModifying: ${task.title}\n`);

    task.title = await question(`Title [${task.title}]: `) || task.title;
    task.description = await question(`Description [${task.description.substring(0, 50)}...]: `) || task.description;
    task.points = parseInt(await question(`Points [${task.points}]: `)) || task.points;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        tasksJson: JSON.stringify(currentTasks),
      },
    });

    console.log('✅ Task updated successfully!');
  } else {
    console.log('❌ Invalid action.');
  }
}

async function viewProjectDetails() {
  console.log('\n🔍 View Project Details...\n');

  const projectId = await question('Enter Project ID: ');

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.log('❌ Project not found.');
    return;
  }

  const tasks = JSON.parse(project.tasksJson);
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);

  console.log(`\n📚 Project Details`);
  console.log('═'.repeat(50));
  console.log(`Title: ${project.title}`);
  console.log(`ID: ${project.id}`);
  console.log(`Description: ${project.description}`);
  console.log(`Starter Repository: ${project.starterRepo}`);
  console.log(`Difficulty: ${project.difficulty}`);
  console.log(`Total Tasks: ${tasks.length}`);
  console.log(`Total Points: ${totalPoints}`);
  console.log('\n📋 Tasks:');

  tasks.forEach((task, index) => {
    console.log(`\n  ${index + 1}. ${task.title}`);
    console.log(`     Description: ${task.description}`);
    console.log(`     Points: ${task.points}`);
  });

  console.log('\n' + '═'.repeat(50));
}

async function clearAllProjects() {
  console.log('\n⚠️ Clear All Projects...\n');

  const confirm = await question('This will delete ALL projects from the database. Are you sure? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled.');
    return;
  }

  try {
    const result = await prisma.project.deleteMany({});
    console.log(`\n✅ Cleared ${result.count} projects from database.`);
  } catch (error) {
    console.error('❌ Error clearing projects:', error.message);
  }
}

async function main() {
  let running = true;

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Project Seed Data Manager            ║');
  console.log('╚════════════════════════════════════════╝\n');

  while (running) {
    console.log('\n📌 Menu:');
    console.log('1. List all projects');
    console.log('2. Add new project');
    console.log('3. Update project');
    console.log('4. Delete project');
    console.log('5. View project details');
    console.log('6. Update project tasks');
    console.log('7. Clear all projects');
    console.log('8. Exit');

    const choice = await question('\nSelect option (1-8): ');

    switch (choice) {
      case '1':
        await listProjects();
        break;
      case '2':
        await addProject();
        break;
      case '3':
        await updateProject();
        break;
      case '4':
        await deleteProject();
        break;
      case '5':
        await viewProjectDetails();
        break;
      case '6':
        await updateProjectTasks();
        break;
      case '7':
        await clearAllProjects();
        break;
      case '8':
        running = false;
        console.log('\n👋 Goodbye!\n');
        break;
      default:
        console.log('\n❌ Invalid option. Please try again.');
    }
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
