/**
 * PDF Report Generator
 * Generates PDF reports from job data using PDFKit
 */

import PDFDocument from 'pdfkit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export type ReportType = 'initial' | 'hydro' | 'full' | 'custom';

interface JobData {
  job: any;
  gates: any[];
  photos: any[];
  chambers: any[];
  equipment: any[];
}

/**
 * Generate PDF report for a job
 * Returns the storage path where PDF is saved
 */
export async function generateReportPDF(
  jobId: string,
  reportType: ReportType,
  configuration: Record<string, unknown> | undefined,
  supabase: SupabaseClient
): Promise<string> {
  // Fetch all job data
  const jobData = await fetchJobData(jobId, supabase);

  // Generate PDF based on report type
  switch (reportType) {
    case 'initial':
      return await generateInitialReport(jobData, supabase);
    case 'hydro':
      return await generateHydroReport(jobData, supabase);
    case 'full':
      return await generateFullReport(jobData, supabase);
    case 'custom':
      return await generateCustomReport(jobData, configuration, supabase);
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

/**
 * Fetch all data needed for report
 */
async function fetchJobData(jobId: string, supabase: SupabaseClient): Promise<JobData> {
  // Get job
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  // Get gates
  const { data: gates } = await supabase
    .from('job_gates')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at');

  // Get photos
  const { data: photos } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at');

  // Get chambers with related data
  const { data: chambers } = await supabase
    .from('chambers')
    .select(`
      *,
      psychrometric_readings (*),
      moisture_points (*)
    `)
    .eq('job_id', jobId);

  // Get equipment logs
  const { data: equipment } = await supabase
    .from('equipment_logs')
    .select('*')
    .eq('job_id', jobId)
    .eq('is_active', true);

  return {
    job: job || null,
    gates: gates || [],
    photos: photos || [],
    chambers: chambers || [],
    equipment: equipment || [],
  };
}

/**
 * Generate initial report (basic job information)
 */
async function generateInitialReport(
  jobData: JobData,
  supabase: SupabaseClient
): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Title
  doc.fontSize(20).text('Initial Report', { align: 'center' });
  doc.moveDown();

  // Job Information
  doc.fontSize(16).text('Job Information', { underline: true });
  doc.fontSize(12);
  doc.text(`Title: ${jobData.job?.title || 'N/A'}`);
  doc.text(`Status: ${jobData.job?.status || 'N/A'}`);
  if (jobData.job?.address_line_1) {
    doc.text(`Address: ${jobData.job.address_line_1}`);
  }
  doc.moveDown();

  // Gates Summary
  doc.fontSize(16).text('Workflow Gates', { underline: true });
  doc.fontSize(12);
  jobData.gates.forEach((gate) => {
    doc.text(`${gate.stage_name}: ${gate.status}`);
  });
  doc.moveDown();

  // Photos Count
  doc.fontSize(16).text('Photos', { underline: true });
  doc.fontSize(12);
  doc.text(`Total Photos: ${jobData.photos.length}`);

  // Finalize PDF
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `initial-${Date.now()}.pdf`;
      const storagePath = `reports/${jobData.job?.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        reject(new Error(`Failed to upload PDF: ${uploadError.message}`));
        return;
      }

      resolve(storagePath);
    });

    doc.on('error', reject);
    doc.end();
  });
}

/**
 * Generate hydro report (drying/chamber data)
 */
async function generateHydroReport(
  jobData: JobData,
  supabase: SupabaseClient
): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Title
  doc.fontSize(20).text('Hydro/Drying Report', { align: 'center' });
  doc.moveDown();

  // Job Information
  doc.fontSize(16).text('Job Information', { underline: true });
  doc.fontSize(12);
  doc.text(`Title: ${jobData.job?.title || 'N/A'}`);
  doc.moveDown();

  // Chambers
  doc.fontSize(16).text('Drying Chambers', { underline: true });
  doc.fontSize(12);
  
  if (jobData.chambers.length === 0) {
    doc.text('No chambers created');
  } else {
    jobData.chambers.forEach((chamber: any) => {
      doc.fontSize(14).text(chamber.name, { underline: true });
      doc.fontSize(12);
      doc.text(`Type: ${chamber.chamber_type}`);
      doc.text(`Status: ${chamber.status}`);
      
      // Psychrometric readings
      const readings = chamber.psychrometric_readings || [];
      if (readings.length > 0) {
        doc.moveDown(0.5);
        doc.text('Latest Readings:');
        const latest = readings[0];
        if (latest.ambient_temp_f) doc.text(`  Temp: ${latest.ambient_temp_f}°F`);
        if (latest.relative_humidity) doc.text(`  RH: ${latest.relative_humidity}%`);
        if (latest.grains_per_pound) doc.text(`  GPP: ${latest.grains_per_pound}`);
      }
      
      // Moisture points
      const moisturePoints = chamber.moisture_points || [];
      if (moisturePoints.length > 0) {
        doc.text(`Moisture Points: ${moisturePoints.length}`);
      }
      
      doc.moveDown();
    });
  }

  // Equipment
  doc.fontSize(16).text('Active Equipment', { underline: true });
  doc.fontSize(12);
  if (jobData.equipment.length === 0) {
    doc.text('No active equipment');
  } else {
    jobData.equipment.forEach((eq: any) => {
      doc.text(`${eq.equipment_type}: ${eq.quantity} units`);
    });
  }

  // Finalize PDF
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `hydro-${Date.now()}.pdf`;
      const storagePath = `reports/${jobData.job?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        reject(new Error(`Failed to upload PDF: ${uploadError.message}`));
        return;
      }

      resolve(storagePath);
    });

    doc.on('error', reject);
    doc.end();
  });
}

/**
 * Generate full report (all data)
 */
async function generateFullReport(
  jobData: JobData,
  supabase: SupabaseClient
): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Title
  doc.fontSize(20).text('Full Report', { align: 'center' });
  doc.moveDown();

  // Job Information
  doc.fontSize(16).text('Job Information', { underline: true });
  doc.fontSize(12);
  doc.text(`Title: ${jobData.job?.title || 'N/A'}`);
  doc.text(`Status: ${jobData.job?.status || 'N/A'}`);
  if (jobData.job?.address_line_1) {
    doc.text(`Address: ${jobData.job.address_line_1}`);
  }
  doc.moveDown();

  // Gates
  doc.fontSize(16).text('Workflow Gates', { underline: true });
  doc.fontSize(12);
  jobData.gates.forEach((gate) => {
    doc.text(`${gate.stage_name}: ${gate.status}`);
    if (gate.completed_at) {
      doc.text(`  Completed: ${new Date(gate.completed_at).toLocaleString()}`);
    }
  });
  doc.moveDown();

  // Chambers (from hydro report)
  if (jobData.chambers.length > 0) {
    doc.fontSize(16).text('Drying Chambers', { underline: true });
    doc.fontSize(12);
    jobData.chambers.forEach((chamber: any) => {
      doc.text(chamber.name);
      const readings = chamber.psychrometric_readings || [];
      if (readings.length > 0) {
        const latest = readings[0];
        doc.text(`  Latest: ${latest.ambient_temp_f}°F, ${latest.relative_humidity}% RH`);
      }
    });
    doc.moveDown();
  }

  // Equipment
  if (jobData.equipment.length > 0) {
    doc.fontSize(16).text('Equipment', { underline: true });
    doc.fontSize(12);
    jobData.equipment.forEach((eq: any) => {
      doc.text(`${eq.equipment_type}: ${eq.quantity} units`);
    });
    doc.moveDown();
  }

  // Photos
  doc.fontSize(16).text('Photos', { underline: true });
  doc.fontSize(12);
  doc.text(`Total Photos: ${jobData.photos.length}`);

  // Finalize PDF
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `full-${Date.now()}.pdf`;
      const storagePath = `reports/${jobData.job?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        reject(new Error(`Failed to upload PDF: ${uploadError.message}`));
        return;
      }

      resolve(storagePath);
    });

    doc.on('error', reject);
    doc.end();
  });
}

/**
 * Generate custom report
 */
async function generateCustomReport(
  jobData: JobData,
  configuration: Record<string, unknown> | undefined,
  supabase: SupabaseClient
): Promise<string> {
  // For custom reports, use full report as base
  // Configuration would specify which sections to include
  return generateFullReport(jobData, supabase);
}
