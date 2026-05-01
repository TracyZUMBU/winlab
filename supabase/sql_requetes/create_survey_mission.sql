-- Create one active survey mission with one question of each type:
-- - text
-- - single_choice
-- - multi_choice

insert into public.missions (
  brand_id,
  title,
  description,
  mission_type,
  validation_mode,
  token_reward,
  status,
  starts_at,
  ends_at,
  max_completions_per_user,
  max_completions_total,
  metadata
)
values (
  -- Replace with an existing brand id
  '654aa4ef-9cef-442f-94e2-398a5774ab62'::uuid,

  'Survey mission demo',
  'Mission de test survey avec 3 types de questions.',
  'survey',
  'automatic',
  25,
  'active',
  now(),
  now() + interval '30 days',
  1,
  null,

  jsonb_build_object(
    'survey',
    jsonb_build_object(
      'startQuestionId', 'q_text_2',
      'questions', jsonb_build_array(
        -- 1) text
        jsonb_build_object(
          'id', 'q_text_2',
          'label', 'Que penses-tu de la mission ?',
          'type', 'text',
          'nextQuestionId', 'q_single_2'
        ),

        -- 2) single_choice (branching per option)
        jsonb_build_object(
          'id', 'q_single_2',
          'label', 'Quelle qualite preferes-tu dans une mission ?',
          'type', 'single_choice',
          'options', jsonb_build_array(
            jsonb_build_object(
              'id', 'opt_easy',
              'label', 'Facile',
              'nextQuestionId', 'q_multi_2'
            ),
            jsonb_build_object(
              'id', 'opt_fun',
              'label', 'Amusante',
              'nextQuestionId', 'q_multi_2'
            ),
            jsonb_build_object(
              'id', 'opt_tech',
              'label', 'Tech',
              'nextQuestionId', 'q_multi_2'
            )
          )
        ),

        -- 3) multi_choice
        jsonb_build_object(
          'id', 'q_multi_2',
          'label', 'Quels types de missions preferes-tu ?',
          'type', 'multi_choice',
          'options', jsonb_build_array(
            jsonb_build_object('id', 'opt_survey', 'label', 'Sondage'),
            jsonb_build_object('id', 'opt_video', 'label', 'Video'),
            jsonb_build_object('id', 'opt_follow', 'label', 'Social'),
            jsonb_build_object('id', 'opt_referral', 'label', 'Parrainage')
          ),
          'nextQuestionId', null
        )
      )
    )
  )
);


-- Example of proof_data for this mission:
-- {
--   "surveyId": "",
--   "answers": [
--     { "questionId": "q_text_1", "value": "Bonne image globale" },
--     { "questionId": "q_single_1", "value": "opt_sport" },
--     { "questionId": "q_multi_1", "value": ["opt_instagram", "opt_youtube"] }
--   ]
-- }