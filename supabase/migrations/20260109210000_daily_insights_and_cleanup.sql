-- Migration: Create daily_insights table and remove deprecated user_performance table
-- Created: 2026-01-09

-- Drop deprecated user_performance table (replaced by user_game_performance)
DROP TABLE IF EXISTS user_performance CASCADE;

-- Create daily_insights table
CREATE TABLE daily_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    source TEXT,
    source_url TEXT,
    day_of_year INT NOT NULL UNIQUE CHECK (day_of_year >= 1 AND day_of_year <= 40),
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on day_of_year for fast daily lookups
CREATE INDEX idx_daily_insights_day_of_year ON daily_insights(day_of_year);

-- Seed with 40 brain facts (will rotate using modulo logic)
INSERT INTO daily_insights (content, source, source_url, day_of_year, category) VALUES
('Your brain generates about 12-25 watts of electricity — enough to power a low-wattage LED light.', 'Harvard Medical School', 'https://hms.harvard.edu/news/brain-power', 1, 'Brain & Cognition'),
('The human brain consists of about 86 billion neurons.', 'Nature', 'https://www.nature.com/articles/s41586-022-04554-y', 2, 'Brain & Cognition'),
('Your brain is 73% water. It takes only 2% dehydration to affect your attention and memory.', 'Journal of Biological Chemistry / BrainFacts.org', 'https://www.brainfacts.org/', 3, 'Brain & Cognition'),
('Sixty percent of the human brain is made of fat, making it the fattiest organ in the body.', 'Northwestern Medicine', 'https://www.nm.org/healthbeat/healthy-tips/11-fun-facts-about-your-brain', 4, 'Brain & Cognition'),
('The human brain isn''t fully formed until age 25.', 'National Institute of Mental Health', 'https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know', 5, 'Brain & Cognition'),
('Brain information travels up to 268 miles per hour.', 'BeBrainFit / SDBIF', 'https://sdbif.org/72-amazing-human-brain-facts-based-on-the-latest-science/', 6, 'Brain & Cognition'),
('The average brain generates up to 50,000 thoughts per day.', 'Laboratory of Neuro Imaging, USC', 'https://sdbif.org/72-amazing-human-brain-facts-based-on-the-latest-science/', 7, 'Brain & Cognition'),
('Every minute, 750-1,000 milliliters of blood flows through the brain.', 'BeBrainFit / SDBIF', 'https://sdbif.org/72-amazing-human-brain-facts-based-on-the-latest-science/', 8, 'Brain & Cognition'),
('Your brain can process an image in as little as 13 milliseconds.', 'MIT', 'https://news.mit.edu/2014/in-the-blink-of-an-eye-0116', 9, 'Brain & Cognition'),
('Men''s brains are 10% bigger than women''s, but women have a larger hippocampus (memory center).', 'Journal of Neuroscience Research', 'https://onlinelibrary.wiley.com/journal/10974547', 10, 'Brain & Cognition'),
('Albert Einstein''s brain was 10% smaller than average, but had higher neuron density.', 'The Lancet', 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(99)01415-9/fulltext', 11, 'Brain & Cognition'),
('Human brains have gotten significantly smaller over the past 20,000 years.', 'Scientific American', 'https://www.scientificamerican.com/article/our-brains-are-shrinking/', 12, 'Brain & Cognition'),
('Chronic stress and depression can cause measurable brain shrinkage.', 'Yale University', 'https://news.yale.edu/2012/08/12/yale-team-discovers-how-stress-and-depression-can-shrink-brain', 13, 'Brain & Cognition'),
('Multitasking decreases your attention span and overall mental performance.', 'Stanford University', 'https://news.stanford.edu/2009/08/24/multitask-082409/', 14, 'Brain & Cognition'),
('The myth that we use only 10% of our brains is false; we use most of it even while sleeping.', 'Mayo Clinic', 'https://www.mayoclinic.org/', 15, 'Brain & Cognition'),
('Alcohol does not kill brain cells; it damages the connective tissue at the end of neurons.', 'Scientific American', 'https://www.scientificamerican.com/article/fact-or-fiction-alcohol-kills-brain-cells/', 16, 'Brain & Cognition'),
('The brain has the capacity to change throughout life due to neuroplasticity.', 'Harvard Health Publishing', 'https://www.health.harvard.edu/blog/brain-plasticity-in-health-and-disease-201601259007', 17, 'Brain & Cognition'),
('Your brain uses 20% of your body''s total energy and oxygen.', 'PNAS', 'https://www.pnas.org/doi/10.1073/pnas.0305513101', 18, 'Brain & Cognition'),
('A piece of brain tissue the size of a grain of sand contains 100,000 neurons and 1 billion synapses.', 'Scientific American', 'https://www.scientificamerican.com/article/100-trillion-connections-new-efforts-to-map-the-connectome/', 19, 'Brain & Cognition'),
('There are as many as 10,000 specific types of neurons in the brain.', 'BrainFacts.org', 'https://www.brainfacts.org/', 20, 'Brain & Cognition'),
('Prolonged intensive training in creative problem-solving can lead to substantial effects on intelligence.', 'Journal of Intelligence', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7709590/', 21, 'Brain & Cognition'),
('Self-reported intelligence is only weakly correlated with psychometrically measured IQ.', 'Intelligence Journal', 'https://www.sciencedirect.com/science/article/abs/pii/S0160289625000364', 22, 'Brain & Cognition'),
('Social intelligence and general IQ are related but distinct cognitive domains.', 'Open Psychology Journal', 'https://www.openpsychologyjournal.com/VOLUME/16/ELOCATOR/e187435012301180/FULLTEXT/', 23, 'Brain & Cognition'),
('ADHD stimulants work by waking up the brain rather than just sharpening focus.', 'ScienceDaily / Neuroscience News', 'https://www.sciencedaily.com/news/mind_brain/neuroscience/', 24, 'Brain & Cognition'),
('The brain''s storage capacity is considered virtually unlimited.', 'Salk Institute', 'https://www.salk.edu/news-release/memory-capacity-of-brain-is-10-times-more-than-previously-thought/', 25, 'Brain & Cognition'),
('Sleep is essential for the brain to clear out metabolic waste products.', 'Science', 'https://www.science.org/doi/10.1126/science.1241224', 26, 'Brain & Cognition'),
('The brain cannot feel pain because it lacks pain receptors.', 'BrainFacts.org', 'https://www.brainfacts.org/brain-anatomy-and-function/anatomy/2014/the-brain-lacks-pain-receptors', 27, 'Brain & Cognition'),
('Reading aloud to children promotes brain development more than just talking to them.', 'American Academy of Pediatrics', 'https://publications.aap.org/pediatrics/article/134/3/e835/32977/Literacy-Promotion-An-Essential-Component-of', 28, 'Brain & Cognition'),
('Learning a second language can delay the onset of dementia by several years.', 'Neurology', 'https://n.neurology.org/content/81/22/1938', 29, 'Brain & Cognition'),
('The brain''s "gut-brain axis" means your digestive system can influence your mood and cognition.', 'Harvard Health Publishing', 'https://www.health.harvard.edu/diseases-and-conditions/the-gut-brain-connection', 30, 'Brain & Cognition'),
('Exercise increases levels of BDNF, a protein that supports the survival of existing neurons.', 'Nature Reviews Neuroscience', 'https://www.nature.com/articles/nrn2298', 31, 'Brain & Cognition'),
('Meditation can physically change the brain''s structure, increasing gray matter density.', 'Psychiatry Research: Neuroimaging', 'https://www.sciencedirect.com/science/article/pii/S092549271000288X', 32, 'Brain & Cognition'),
('High-quality sleep improves memory consolidation, the process of turning short-term memories into long-term ones.', 'Nature Neuroscience', 'https://www.nature.com/articles/nn.3324', 33, 'Brain & Cognition'),
('The brain''s prefrontal cortex is responsible for executive functions like decision-making and impulse control.', 'Harvard University', 'https://developingchild.harvard.edu/science/key-concepts/executive-function/', 34, 'Brain & Cognition'),
('Synaptic pruning is the process where the brain eliminates extra neurons and synapses to increase efficiency.', 'Nature Neuroscience', 'https://www.nature.com/articles/nn.2881', 35, 'Brain & Cognition'),
('Oxytocin, often called the "love hormone," is produced in the hypothalamus and plays a role in social bonding.', 'Nature', 'https://www.nature.com/articles/nature14489', 36, 'Brain & Cognition'),
('The amygdala is the brain''s primary center for processing emotions, especially fear.', 'Journal of Neuroscience', 'https://www.jneurosci.org/content/22/13/5271', 37, 'Brain & Cognition'),
('Neurogenesis, the creation of new neurons, continues in the adult hippocampus.', 'Cell Stem Cell', 'https://www.cell.com/cell-stem-cell/fulltext/S1934-5909(18)30121-0', 38, 'Brain & Cognition'),
('The "Flynn Effect" refers to the observed rise in average IQ scores over the 20th century.', 'American Psychologist', 'https://psycnet.apa.org/record/1987-28155-001', 39, 'Brain & Cognition'),
('Working memory has a limited capacity, often cited as "the magical number seven, plus or minus two."', 'Psychological Review', 'https://psycnet.apa.org/record/1956-06781-001', 40, 'Brain & Cognition');

-- Create a helper function to get today's insight using modulo rotation
-- This allows the 40 facts to cycle indefinitely
CREATE OR REPLACE FUNCTION get_daily_insight()
RETURNS TABLE (
    id UUID,
    content TEXT,
    source TEXT,
    source_url TEXT,
    category TEXT
) AS $$
DECLARE
    days_since_epoch INT;
    rotated_day INT;
BEGIN
    -- Calculate days since Unix epoch
    days_since_epoch := EXTRACT(EPOCH FROM CURRENT_DATE)::INT / 86400;
    
    -- Use modulo to rotate through 40 facts (1-40)
    rotated_day := (days_since_epoch % 40) + 1;
    
    RETURN QUERY
    SELECT 
        di.id,
        di.content,
        di.source,
        di.source_url,
        di.category
    FROM daily_insights di
    WHERE di.day_of_year = rotated_day;
END;
$$ LANGUAGE plpgsql;
