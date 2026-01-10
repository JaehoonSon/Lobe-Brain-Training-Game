-- Add recommended_rounds column to games table
ALTER TABLE games
ADD COLUMN recommended_rounds INTEGER NOT NULL DEFAULT 3;

-- Add comment for documentation
COMMENT ON COLUMN games.recommended_rounds IS 'Recommended number of rounds for this game type';
