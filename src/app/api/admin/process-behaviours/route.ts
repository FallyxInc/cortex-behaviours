import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { adminDb } from '@/lib/firebase-admin';

const execAsync = promisify(exec);

// Map home name to altName (same logic as BehavioursDashboard)
function getAltName(home: string): string {
  if (home === 'ONCB') return 'oneill';
  if (home === 'MCB') return 'millCreek';
  if (home === 'berkshire') return 'berkshire';
  if (home === 'banwell') return 'banwell';
  return home;
}

export async function POST(request: NextRequest) {
  console.log('🚀 [API] Starting behaviour files processing...');
  
  try {
    const formData = await request.formData();
    const home = formData.get('home') as string;
    const pdfCount = parseInt(formData.get('pdfCount') as string) || 0;
    const excelCount = parseInt(formData.get('excelCount') as string) || 0;
    
    // Get overview metrics
    const antipsychoticsPercentage = formData.get('antipsychoticsPercentage') as string;
    const antipsychoticsChange = formData.get('antipsychoticsChange') as string;
    const antipsychoticsResidents = formData.get('antipsychoticsResidents') as string;
    
    const worsenedPercentage = formData.get('worsenedPercentage') as string;
    const worsenedChange = formData.get('worsenedChange') as string;
    const worsenedResidents = formData.get('worsenedResidents') as string;
    
    const improvedPercentage = formData.get('improvedPercentage') as string;
    const improvedChange = formData.get('improvedChange') as string;
    const improvedResidents = formData.get('improvedResidents') as string;
    
    console.log('📊 [API] Request parameters:', { home, pdfCount, excelCount, hasMetrics: !!(antipsychoticsPercentage || worsenedPercentage || improvedPercentage) });

    if (!home) {
      console.error('❌ [API] Missing home');
      return NextResponse.json({ error: 'Home is required' }, { status: 400 });
    }

    // If no files, we can still save metrics
    const hasFiles = pdfCount > 0 && excelCount > 0;
    const hasMetrics = !!(antipsychoticsPercentage || worsenedPercentage || improvedPercentage);
    
    // If no files and no metrics, that's okay - just return success (preserves existing values)
    if (!hasFiles && !hasMetrics) {
      return NextResponse.json({
        success: true,
        message: 'No changes made - existing values preserved',
        metricsSaved: false
      });
    }

    // Save metrics to Firebase if provided (if not provided, existing values are preserved)
    if (hasMetrics) {
      const altName = getAltName(home);
      const metricsRef = adminDb.ref(`/${altName}/overviewMetrics`);
      
      const metricsData: any = {};
      
      if (antipsychoticsPercentage) {
        metricsData.antipsychotics = {
          percentage: parseInt(antipsychoticsPercentage) || 0,
          change: parseInt(antipsychoticsChange || '0') || 0,
          residents: antipsychoticsResidents ? antipsychoticsResidents.split(',').map(r => r.trim()).filter(r => r) : []
        };
      }
      
      if (worsenedPercentage) {
        metricsData.worsened = {
          percentage: parseInt(worsenedPercentage) || 0,
          change: parseInt(worsenedChange || '0') || 0,
          residents: worsenedResidents ? worsenedResidents.split(',').map(r => r.trim()).filter(r => r) : []
        };
      }
      
      if (improvedPercentage) {
        metricsData.improved = {
          percentage: parseInt(improvedPercentage) || 0,
          change: parseInt(improvedChange || '0') || 0,
          residents: improvedResidents ? improvedResidents.split(',').map(r => r.trim()).filter(r => r) : []
        };
      }
      
      // Get existing metrics to preserve values not being updated
      const existingSnapshot = await metricsRef.once('value');
      const existingData = existingSnapshot.exists() ? existingSnapshot.val() : {};
      
      // Merge existing data with new data (only update provided metrics)
      const mergedData = {
        ...existingData,
        ...metricsData
      };
      
      await metricsRef.set(mergedData);
      console.log('✅ [API] Metrics saved to Firebase');
    }

    // If no files, return early after saving metrics
    if (!hasFiles) {
      return NextResponse.json({
        success: true,
        message: 'Metrics saved successfully',
        metricsSaved: true
      });
    }

    const pdfFiles: File[] = [];
    for (let i = 0; i < pdfCount; i++) {
      const file = formData.get(`pdf_${i}`) as File;
      if (file) {
        pdfFiles.push(file);
        console.log(`📄 [API] Extracted PDF file ${i}: ${file.name}`);
      }
    }

    const excelFiles: File[] = [];
    for (let i = 0; i < excelCount; i++) {
      const file = formData.get(`excel_${i}`) as File;
      if (file) {
        excelFiles.push(file);
        console.log(`📊 [API] Extracted Excel file ${i}: ${file.name}`);
      }
    }

    const homeDir = join(process.cwd(), 'python', home);
    const downloadsDir = join(homeDir, 'downloads');

    console.log(`🏠 [API] Creating directories for home: ${home}`);
    await mkdir(downloadsDir, { recursive: true });
    console.log('✅ [API] Directories created');

    console.log(`💾 [API] Saving ${pdfFiles.length} PDF files and ${excelFiles.length} Excel files`);
    
    for (const file of pdfFiles) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const path = join(downloadsDir, file.name);
      await writeFile(path, Buffer.from(bytes));
      console.log(`✅ [API] Saved PDF: ${file.name}`);
    }
    
    for (const file of excelFiles) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const path = join(downloadsDir, file.name);
      await writeFile(path, Buffer.from(bytes));
      console.log(`✅ [API] Saved Excel: ${file.name}`);
    }

    console.log('✅ [API] All files saved successfully');

    console.log('🐍 [PYTHON] Installing required packages...');
    try {
      await execAsync(`python3 -m pip install --user --break-system-packages pdfplumber openai pandas python-dotenv openpyxl`);
      console.log('✅ [PYTHON] Packages installed successfully');
    } catch (pipErr) {
      console.log('⚠️ [PYTHON] Package installation warning:', pipErr);
    }

    console.log('🐍 [PYTHON] Step 1: Processing Excel data...');
    try {
      const excelResult = await execAsync(`cd "${homeDir}" && python3 getExcelInfo.py`);
      console.log('✅ [PYTHON] Excel processing completed');
      console.log('📊 [PYTHON] Excel output:', excelResult.stdout);
      if (excelResult.stderr) {
        console.log('⚠️ [PYTHON] Excel warnings:', excelResult.stderr);
      }
    } catch (error) {
      console.error('❌ [PYTHON] Excel processing failed:', error);
      throw error;
    }

    console.log('🐍 [PYTHON] Step 2: Processing PDF data...');
    try {
      const pdfResult = await execAsync(`cd "${homeDir}" && python3 getPdfInfo.py`);
      console.log('✅ [PYTHON] PDF processing completed');
      console.log('📊 [PYTHON] PDF output:', pdfResult.stdout);
      if (pdfResult.stderr) {
        console.log('⚠️ [PYTHON] PDF warnings:', pdfResult.stderr);
      }
    } catch (error) {
      console.error('❌ [PYTHON] PDF processing failed:', error);
      throw error;
    }

    console.log('🐍 [PYTHON] Step 3: Generating behaviour data...');
    try {
      const behaviourResult = await execAsync(`cd "${homeDir}" && python3 getBe.py`);
      console.log('✅ [PYTHON] Behaviour data generation completed');
      console.log('📊 [PYTHON] Behaviour output:', behaviourResult.stdout);
      if (behaviourResult.stderr) {
        console.log('⚠️ [PYTHON] Behaviour warnings:', behaviourResult.stderr);
      }
    } catch (error) {
      console.error('❌ [PYTHON] Behaviour data generation failed:', error);
      throw error;
    }
    console.log('🐍 [PYTHON] Step 4: Updating dashboard...');
    try {
      const dashboardResult = await execAsync(`cd "${homeDir}" && python3 update.py`);
      console.log('✅ [PYTHON] Dashboard updated successfully');
      console.log('📊 [PYTHON] Dashboard output:', dashboardResult.stdout);
      if (dashboardResult.stderr) {
        console.log('⚠️ [PYTHON] Dashboard warnings:', dashboardResult.stderr);
      }
    } catch (error) {
      console.error('❌ [PYTHON] Dashboard update failed:', error);
      throw error;
    }
    console.log('🐍 [PYTHON] Step 5: Uploading to dashboard...');
    try {
      const uploadResult = await execAsync(`cd "${homeDir}" && python3 upload_to_dashboard.py`);
      console.log('✅ [PYTHON] Dashboard uploaded successfully');
      console.log('📊 [PYTHON] Dashboard output:', uploadResult.stdout);
      if (uploadResult.stderr) {
        console.log('⚠️ [PYTHON] Dashboard warnings:', uploadResult.stderr);
      }
    } catch (error) {
      console.error('❌ [PYTHON] Dashboard upload failed:', error);
      throw error;
    }

    console.log('🎉 [API] File processing completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Files processed successfully' + (hasMetrics ? ' and metrics saved' : ''),
      fileCounts: {
        pdfs: pdfFiles.length,
        excels: excelFiles.length
      },
      metricsSaved: hasMetrics
    });

  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: 'Failed to process files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

