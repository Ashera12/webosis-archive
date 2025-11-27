import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { THEME_TEMPLATES, templateToSettings } from '@/lib/themeTemplates';
import { setAdminSettings } from '@/lib/adminSettings';

/**
 * POST /api/admin/theme/apply-template
 * Apply a theme template to both dark and light modes
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const adminRoles = ['super_admin', 'admin', 'osis'];
    if (!session?.user?.role || !adminRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, applyToBoth = true } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const template = THEME_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Convert template to settings
    const allSettings: Record<string, string> = {};

    if (applyToBoth) {
      // Apply to both dark and light mode
      Object.assign(allSettings, templateToSettings(template, true));  // Dark
      Object.assign(allSettings, templateToSettings(template, false)); // Light
    } else {
      // Only apply to current mode (you can add mode detection logic here)
      Object.assign(allSettings, templateToSettings(template, true));
    }

    // Save all settings
    await setAdminSettings(allSettings);

    console.log('[Apply Template] Successfully applied template:', {
      templateId,
      name: template.name,
      settingsCount: Object.keys(allSettings).length,
      applyToBoth,
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
      },
      appliedSettings: Object.keys(allSettings).length,
      message: `Template "${template.name}" berhasil diterapkan!`
    });
  } catch (error: any) {
    console.error('[Apply Template] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply template', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/theme/apply-template
 * List all available theme templates
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const adminRoles = ['super_admin', 'admin', 'osis'];
    if (!session?.user?.role || !adminRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      templates: THEME_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        preview: t.preview,
      })),
      count: THEME_TEMPLATES.length,
    });
  } catch (error: any) {
    console.error('[Get Templates] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get templates', details: error.message },
      { status: 500 }
    );
  }
}
