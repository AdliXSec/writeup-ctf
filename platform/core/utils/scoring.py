import sqlite3

def get_challenge_scores(conn):
    try:
        chals = conn.execute('SELECT name, base_points, is_dynamic FROM challenges').fetchall()
    except sqlite3.OperationalError:
        # Fallback if migration hasn't run yet
        chals = conn.execute('SELECT name, base_points, 0 as is_dynamic FROM challenges').fetchall()
        
    solves = conn.execute('SELECT challenge_id, COUNT(*) as count FROM solves GROUP BY challenge_id').fetchall()
    solve_counts = {row['challenge_id']: row['count'] for row in solves}
    
    scores = {}
    for chal in chals:
        name = chal['name']
        base_points = chal['base_points']
        is_dynamic = chal['is_dynamic']
        count = solve_counts.get(name, 0)
        
        if is_dynamic:
            points = max(50, base_points - (count * 10))
        else:
            points = base_points
            
        scores[name] = points
    return scores
