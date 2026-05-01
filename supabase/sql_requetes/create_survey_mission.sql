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
  '00000000-0000-0000-0000-000000000000'::uuid,

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
      'startQuestionId', 'q_text_1',
      'questions', jsonb_build_array(
        -- 1) text
        jsonb_build_object(
          'id', 'q_text_1',
          'label', 'Que penses-tu de cette marque ?',
          'type', 'text',
          'nextQuestionId', 'q_single_1'
        ),

        -- 2) single_choice (branching per option)
        jsonb_build_object(
          'id', 'q_single_1',
          'label', 'Quelle categorie preferes-tu ?',
          'type', 'single_choice',
          'options', jsonb_build_array(
            jsonb_build_object(
              'id', 'opt_sport',
              'label', 'Sport',
              'nextQuestionId', 'q_multi_1'
            ),
            jsonb_build_object(
              'id', 'opt_lifestyle',
              'label', 'Lifestyle',
              'nextQuestionId', 'q_multi_1'
            ),
            jsonb_build_object(
              'id', 'opt_tech',
              'label', 'Tech',
              'nextQuestionId', 'q_multi_1'
            )
          )
        ),

        -- 3) multi_choice
        jsonb_build_object(
          'id', 'q_multi_1',
          'label', 'Quels canaux utilises-tu le plus ?',
          'type', 'multi_choice',
          'options', jsonb_build_array(
            jsonb_build_object('id', 'opt_instagram', 'label', 'Instagram'),
            jsonb_build_object('id', 'opt_tiktok', 'label', 'TikTok'),
            jsonb_build_object('id', 'opt_youtube', 'label', 'YouTube'),
            jsonb_build_object('id', 'opt_x', 'label', 'X')
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