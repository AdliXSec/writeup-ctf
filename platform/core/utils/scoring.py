import sqlite3

def get_challenge_scores(conn):
    try:
        chals = conn.execute('SELECT name, base_points, is_dynamic, min_points, decay FROM challenges').fetchall()
    except sqlite3.OperationalError:
        # Fallback if migration hasn't run yet
        chals = conn.execute('SELECT name, base_points, 0 as is_dynamic, 50 as min_points, 10 as decay FROM challenges').fetchall()
        
    solves = conn.execute('SELECT challenge_id, COUNT(*) as count FROM solves GROUP BY challenge_id').fetchall()
    solve_counts = {row['challenge_id']: row['count'] for row in solves}
    
    scores = {}
    for chal in chals:
        name = chal['name']
        base_points = chal['base_points']
        is_dynamic = chal['is_dynamic']
        min_points = chal['min_points']
        decay = chal['decay']
        count = solve_counts.get(name, 0)
        
        if is_dynamic:
            points = max(min_points, base_points - (count * decay))
        else:
            points = base_points
            
        scores[name] = points
    return scores
