CREATE TABLE IF NOT EXISTS birthday_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id text NOT NULL,
  recipient text NOT NULL CHECK (length(recipient) BETWEEN 1 AND 35),
  sender text NOT NULL CHECK (length(sender) BETWEEN 1 AND 40),
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 600),
  photo text,
  prompt text NOT NULL DEFAULT '',
  expected_guests text[] NOT NULL DEFAULT '{}',
  invite_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  reveal_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS birthday_cards_organizer_idx
  ON birthday_cards (organizer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS birthday_wishes (
  card_id uuid NOT NULL REFERENCES birthday_cards(id),
  submission_id uuid NOT NULL,
  sender text NOT NULL CHECK (length(sender) BETWEEN 1 AND 40),
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 600),
  photo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, submission_id)
);

CREATE OR REPLACE FUNCTION birthday_submit_wish(
  card_id_input uuid, invite_key_input uuid, submission_input uuid,
  sender_input text, message_input text, photo_input text
) RETURNS text LANGUAGE plpgsql AS $body$
DECLARE card birthday_cards%ROWTYPE;
BEGIN
  SELECT * INTO card FROM birthday_cards
    WHERE id = card_id_input AND invite_key = invite_key_input FOR UPDATE;
  IF NOT FOUND THEN RETURN 'unavailable'; END IF;
  IF EXISTS (SELECT 1 FROM birthday_wishes WHERE card_id = card.id AND submission_id = submission_input)
    THEN RETURN 'saved'; END IF;
  IF card.published_at IS NOT NULL THEN RETURN 'closed'; END IF;
  IF (SELECT count(*) FROM birthday_wishes WHERE card_id = card.id) >= 30
    THEN RETURN 'full'; END IF;
  INSERT INTO birthday_wishes (card_id, submission_id, sender, message, photo)
    VALUES (card.id, submission_input, sender_input, message_input, photo_input);
  RETURN 'saved';
END;
$body$;

ALTER TABLE birthday_cards ADD COLUMN IF NOT EXISTS storyboard jsonb;
