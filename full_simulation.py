import math

# Mulberry32 PRNG
class SeededRandom:
    def __init__(self, seed):
        self.seed = seed & 0xFFFFFFFF
    
    def next(self):
        t = (self.seed + 0x6D2B79F5) & 0xFFFFFFFF
        self.seed = t
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t = (t ^ (t + ((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) >> 0) / 4294967296

# Configuration
rng = SeededRandom(12345)
minDistance = 5
maxAttempts = 50
gridWidth = 72
gridHeight = 48
cellSize = minDistance / math.sqrt(2)
gridCols = math.ceil(gridWidth / cellSize)
gridRows = math.ceil(gridHeight / cellSize)

# Exclusion zone
excludedZones = [{"x": 36, "y": 24, "radius": 1}]

# Grid
grid = [[None for _ in range(gridCols)] for _ in range(gridRows)]

def isInExcludedZone(point):
    for zone in excludedZones:
        distance = math.sqrt((point["x"] - zone["x"])**2 + (point["y"] - zone["y"])**2)
        if distance < zone["radius"]:
            return True
    return False

def insertIntoGrid(point):
    gridX = int(point["x"] / cellSize)
    gridY = int(point["y"] / cellSize)
    if 0 <= gridY < gridRows and 0 <= gridX < gridCols:
        grid[gridY][gridX] = point

def hasNearbyPoints(point):
    gridX = int(point["x"] / cellSize)
    gridY = int(point["y"] / cellSize)
    
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            checkX = gridX + dx
            checkY = gridY + dy
            
            if (0 <= checkY < gridRows and 0 <= checkX < gridCols and 
                grid[checkY][checkX] is not None):
                existingPoint = grid[checkY][checkX]
                distance = math.sqrt(
                    (point["x"] - existingPoint["x"])**2 +
                    (point["y"] - existingPoint["y"])**2
                )
                
                if distance < minDistance:
                    return True
    return False

def isInBounds(point):
    return 0 <= point["x"] < gridWidth and 0 <= point["y"] < gridHeight

# Find initial point
initial = None
for _ in range(1000):
    candidate = {
        "x": int(rng.next() * gridWidth),
        "y": int(rng.next() * gridHeight)
    }
    if not isInExcludedZone(candidate):
        initial = candidate
        break

print(f"Initial point: ({initial['x']}, {initial['y']})")
print()

points = [initial]
activeList = [initial]
insertIntoGrid(initial)

# Main loop
iteration = 0
while len(activeList) > 0 and len(points) < 15:
    iteration += 1
    randomIndex = int(rng.next() * len(activeList))
    point = activeList[randomIndex]
    found = False
    
    print(f"=== Iteration {iteration} ===")
    print(f"Active list size: {len(activeList)}, Points: {len(points)}")
    print(f"Selected point: ({point['x']}, {point['y']})")
    
    # Try to place new point
    rejection_reasons = {"bounds": 0, "excluded": 0, "nearby": 0}
    
    for i in range(maxAttempts):
        angle = rng.next() * math.pi * 2
        radius = minDistance * (1 + rng.next())
        
        candidate = {
            "x": round(point["x"] + radius * math.cos(angle)),
            "y": round(point["y"] + radius * math.sin(angle))
        }
        
        # Track rejection reasons
        if not isInBounds(candidate):
            rejection_reasons["bounds"] += 1
            continue
        if isInExcludedZone(candidate):
            rejection_reasons["excluded"] += 1
            continue
        if hasNearbyPoints(candidate):
            rejection_reasons["nearby"] += 1
            continue
        
        # Found valid candidate
        points.append(candidate)
        activeList.append(candidate)
        insertIntoGrid(candidate)
        found = True
        print(f"  ✓ Found valid point at ({candidate['x']}, {candidate['y']}) after {i+1} attempts")
        break
    
    if not found:
        print(f"  ✗ Failed to find valid point after {maxAttempts} attempts")
        print(f"    Rejections: bounds={rejection_reasons['bounds']}, excluded={rejection_reasons['excluded']}, nearby={rejection_reasons['nearby']}")
        activeList.pop(randomIndex)
    
    print()
    
    if iteration > 20:  # Limit output
        print("... stopping simulation ...")
        break

print(f"\nFinal result: {len(points)} points placed")
print("Points:", [(p["x"], p["y"]) for p in points])

