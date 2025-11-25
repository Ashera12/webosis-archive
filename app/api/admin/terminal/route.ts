import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const ALLOWED_COMMANDS = [
  'npm install',
  'npm run build',
  'npm run dev',
  'git status',
  'git pull',
  'git log',
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Terminal API ready',
      allowedCommands: ALLOWED_COMMANDS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { command } = body;

    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 });
    }

    // Check if command is allowed
    const isAllowed = ALLOWED_COMMANDS.some(cmd => command.startsWith(cmd));
    
    if (!isAllowed) {
      return NextResponse.json({
        error: 'Command not allowed',
        allowedCommands: ALLOWED_COMMANDS,
      }, { status: 403 });
    }

    // For security, we don't actually execute commands in this placeholder
    return NextResponse.json({
      success: false,
      message: 'Terminal execution not yet implemented for security reasons',
      command,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
