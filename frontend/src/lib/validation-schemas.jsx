import * as z from "zod"

// Mass Production Schema
export const massProductionSchema = z.object({
  id: z.string().min(1, "ID is required"),
  status: z.enum(["cancelled", "closed", "on-going", "stand-by"]),
  status_type: z.enum(["ok", "no"]),
  project_n: z.string().min(1, "Project number is required"),
  product_designation: z.array(z.string()).min(1, "At least one product designation is required"),
  description: z.string().optional(),
  customer: z.string().min(1, "Customer is required"),
  technical_skill: z.enum(["sc", "tc"]),
  initial_request: z.string().min(1, "Initial request date is required"),
  request_original: z.enum(["internal", "customer"]),
})

// Feasibility Schema
export const feasibilitySchema = z.object({
  product: z.boolean().optional(),
  raw_material_type: z.boolean().optional(),
  raw_material_qty: z.boolean().optional(),
  packaging: z.boolean().optional(),
  purchased_part: z.boolean().optional(),
  injection_cycle_time: z.boolean().optional(),
  moulding_labor: z.boolean().optional(),
  press_size: z.boolean().optional(),
  assembly_finishing_paint_cycle_time: z.boolean().optional(),
  assembly_finishing_paint_labor: z.boolean().optional(),
  ppm_level: z.boolean().optional(),
  pre_study: z.boolean().optional(),
  project_management: z.boolean().optional(),
  study_design: z.boolean().optional(),
  cae_design: z.boolean().optional(),
  monitoring: z.boolean().optional(),
  measurement_metrology: z.boolean().optional(),
  validation: z.boolean().optional(),
  molds: z.boolean().optional(),
  special_machines: z.boolean().optional(),
  checking_fixture: z.boolean().optional(),
  equipment_painting_prehension: z.boolean().optional(),
  run_validation: z.boolean().optional(),
  stock_production_coverage: z.boolean().optional(),
  is_presentation: z.boolean().optional(),
  documentation_update: z.boolean().optional(),
})

// Validation For Offer Schema
export const validationForOfferSchema = z.object({
  name: z.string().min(1, "Name is required"),
  check: z.boolean().optional(),
  date: z.string().optional(),
  upload: z.any().optional(),
})

// Kick Off Schema
export const kickOffSchema = z.object({
  timeScheduleApproved: z.boolean().optional(),
  modificationLaunchOrder: z.boolean().optional(),
  projectRiskAssessment: z.boolean().optional(),
  standardsImpact: z.boolean().optional(),
  validationOfCosts: z.boolean().optional(),
})

// Facilities Schema
export const facilitiesSchema = z.object({
  reception_of_modified_means: z.boolean().optional(),
  reception_of_modified_tools: z.boolean().optional(),
  reception_of_modified_fixtures: z.boolean().optional(),
  reception_of_modified_parts: z.boolean().optional(),
  control_plan: z.boolean().optional(),
})

// P_P_Tuning Schema
export const ppTuningSchema = z.object({
  product_process_tuning: z.boolean().optional(),
  functional_validation_test: z.boolean().optional(),
  dimensional_validation_test: z.boolean().optional(),
  aspect_validation_test: z.boolean().optional(),
  supplier_order_modification: z.boolean().optional(),
  acceptation_of_supplier: z.boolean().optional(),
  capability: z.boolean().optional(),
  manufacturing_of_control_parts: z.boolean().optional(),
  product_training: z.boolean().optional(),
  process_training: z.boolean().optional(),
  purchase_file: z.boolean().optional(),
  means_technical_file_data: z.boolean().optional(),
  means_technical_file_manufacturing: z.boolean().optional(),
  means_technical_file_maintenance: z.boolean().optional(),
  tooling_file: z.boolean().optional(),
  product_file: z.boolean().optional(),
  internal_process: z.boolean().optional(),
})

// Process Qualification Schema
export const processQualificationSchema = z.object({
  updating_of_capms: z.boolean().optional(),
  modification_of_customer_logistics: z.boolean().optional(),
  qualification_of_supplier: z.boolean().optional(),
  presentation_of_initial_samples: z.boolean().optional(),
  filing_of_initial_samples: z.boolean().optional(),
  information_on_modification_implementation: z.boolean().optional(),
  full_production_run: z.boolean().optional(),
  request_for_dispensation: z.boolean().optional(),
  process_qualification: z.boolean().optional(),
  initial_sample_acceptance: z.boolean().optional(),
})

// Qualification Confirmation Schema
export const qualificationConfirmationSchema = z.object({
  using_up_old_stock: z.boolean().optional(),
  using_up_safety_stocks: z.boolean().optional(),
  updating_version_number_mould: z.boolean().optional(),
  updating_version_number_product_label: z.boolean().optional(),
  management_of_manufacturing_programmes: z.boolean().optional(),
  specific_spotting_of_packaging_with_label: z.boolean().optional(),
  management_of_galia_identification_labels: z.boolean().optional(),
  preservation_measure: z.boolean().optional(),
  product_traceability_label_modification: z.boolean().optional(),
  information_to_production: z.boolean().optional(),
  information_to_customer_logistics: z.boolean().optional(),
  information_to_customer_quality: z.boolean().optional(),
  updating_customer_programme_data_sheet: z.boolean().optional(),
})

// Ok For Lunch Schema
export const okForLunchSchema = z.object({
  check: z.boolean().optional(),
  date: z.string().optional(),
  upload: z.any().optional(),
})

// Combined Schema
export const formSchema = z.object({
  massProduction: massProductionSchema,
  feasibility: feasibilitySchema,
  validationForOffer: validationForOfferSchema,
  kickOff: kickOffSchema,
  facilities: facilitiesSchema,
  ppTuning: ppTuningSchema,
  processQualification: processQualificationSchema,
  qualificationConfirmation: qualificationConfirmationSchema,
  okForLunch: okForLunchSchema,
})
