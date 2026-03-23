insert into public.users (id, name, role, phone, locale)
values
  ('11111111-1111-1111-1111-111111111111', 'Riya Deshmukh', 'patient', '+91-90000-00000', 'en-IN'),
  ('22222222-2222-2222-2222-222222222222', 'Anil Deshmukh', 'caregiver', '+91-91111-11111', 'en-IN')
on conflict (id) do nothing;

insert into public.caregiver_links (caregiver_user_id, patient_user_id)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into public.devices (
  id,
  user_id,
  ip_address,
  status,
  current_slot,
  firmware_version,
  requires_fingerprint,
  last_seen,
  last_activity
)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '192.168.4.1',
  'online',
  4,
  'v0.9.3',
  true,
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.slots (id, device_id, slot_number, type, medicines, capacity, remaining, rotation_angle)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 1, 'single', '["Levothyroxine"]', 1, 18, 72),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 2, 'single', '["Amlodipine"]', 1, 10, 144),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 3, 'single', '["Pantoprazole"]', 1, 12, 216),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 4, 'dual', '["Aspirin","Vitamin D3"]', 2, 22, 288),
  ('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333333', 5, 'dual', '["Metformin","Atorvastatin"]', 2, 6, 360)
on conflict (id) do nothing;

insert into public.medications (id, user_id, name, dosage, frequency, duration, timing, remaining_pills, refill_threshold, instructions)
values
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    'Aspirin',
    '75 mg',
    1,
    30,
    '{"partsOfDay":["morning"],"mealRelation":"after_food","customTimes":["09:00"]}',
    18,
    5,
    '["Take after breakfast."]'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    'Vitamin D3',
    '1000 IU',
    1,
    45,
    '{"partsOfDay":["morning"],"mealRelation":"after_food","customTimes":["09:00"]}',
    14,
    5,
    '["Take after breakfast for better tolerance."]'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '11111111-1111-1111-1111-111111111111',
    'Metformin',
    '500 mg',
    2,
    60,
    '{"partsOfDay":["morning","evening"],"mealRelation":"with_food","customTimes":["09:00","21:00"]}',
    4,
    6,
    '["Take with meals."]'
  ),
  (
    '55555555-5555-5555-5555-555555555554',
    '11111111-1111-1111-1111-111111111111',
    'Atorvastatin',
    '10 mg',
    1,
    30,
    '{"partsOfDay":["night"],"mealRelation":"anytime","customTimes":["21:00"]}',
    9,
    5,
    '["Take at night."]'
  )
on conflict (id) do nothing;

insert into public.schedules (id, medication_id, slot_id, bundle_key, bundle_medicines, scheduled_for, time, status)
values
  (
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    '44444444-4444-4444-4444-444444444444',
    to_char(current_date, 'YYYY-MM-DD') || '-09:00-slot-4',
    '["Aspirin","Vitamin D3"]',
    current_date,
    '09:00',
    'taken'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555552',
    '44444444-4444-4444-4444-444444444444',
    to_char(current_date, 'YYYY-MM-DD') || '-09:00-slot-4',
    '["Aspirin","Vitamin D3"]',
    current_date,
    '09:00',
    'taken'
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '55555555-5555-5555-5555-555555555553',
    '44444444-4444-4444-4444-444444444445',
    to_char(current_date, 'YYYY-MM-DD') || '-21:00-slot-5',
    '["Metformin","Atorvastatin"]',
    current_date,
    '21:00',
    'pending'
  ),
  (
    '66666666-6666-6666-6666-666666666664',
    '55555555-5555-5555-5555-555555555554',
    '44444444-4444-4444-4444-444444444445',
    to_char(current_date, 'YYYY-MM-DD') || '-21:00-slot-5',
    '["Metformin","Atorvastatin"]',
    current_date,
    '21:00',
    'pending'
  )
on conflict (id) do nothing;

insert into public.logs (schedule_id, status, source, timestamp, notes)
values
  ('66666666-6666-6666-6666-666666666661', 'taken', 'sensor', now() - interval '10 minutes', 'Morning bundle confirmed.'),
  ('66666666-6666-6666-6666-666666666662', 'taken', 'sensor', now() - interval '10 minutes', 'Morning bundle confirmed.')
on conflict do nothing;

insert into public.hardware_logs (device_id, slot_id, event, timestamp, details)
values
  (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    'dispensed',
    now() - interval '12 minutes',
    'Morning bundle dispensed successfully.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    'pickup_confirmed',
    now() - interval '10 minutes',
    'IR + load cell confirmation.'
  )
on conflict do nothing;
