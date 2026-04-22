import java.util.*;

public class ReferralPathFinder {

    private StudentGraph graph;

    public ReferralPathFinder(StudentGraph graph) {
        // Constructor
        this.graph = graph;
    }

    public List<UniversityStudent> findReferralPath(UniversityStudent start, String targetCompany) {
        // Method signature only

        // keeps track of the cost
        Map<UniversityStudent, Integer> dist = new HashMap<>();
        // will store the patent of each student, so we can trace back
        Map<UniversityStudent, UniversityStudent> prev = new HashMap<>();

        // make all student distancess high at start
        for (UniversityStudent node : graph.getAllNodes()) {
            dist.put(node, Integer.MAX_VALUE);
        }
        // the starting student is 0 distance away from themselves
        dist.put(start, 0);

        // priority queue to help explore the strongest connections
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));

        // creates a mapping of indexs to studenst for easier references in the queue
        Map<Integer, UniversityStudent> indexMap = new HashMap<>();
        List<UniversityStudent> nodes = new ArrayList<>(graph.getAllNodes());
        for (int i = 0; i < nodes.size(); i++) {
            indexMap.put(i, nodes.get(i));
        }

        // will sort by cost, so we can eval the strongest connections first
        PriorityQueue<long[]> queue = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
        // maps students back to the integer index
        Map<UniversityStudent, Integer> studentIndex = new HashMap<>();
        for (int i = 0; i < nodes.size(); i++) {
            studentIndex.put(nodes.get(i), i);
        }
        // adds the starting studen to the q to begin search
        queue.offer(new long[]{0, studentIndex.get(start)});

        // keeps track of best paths
        Set<UniversityStudent> visited = new HashSet<>();

        // the main search loop
        while (!queue.isEmpty()) {
            // pull the student with the strongest link, least cost
            long[] curr = queue.poll();
            int currCost = (int) curr[0];
            UniversityStudent currStudent = nodes.get((int) curr[1]);

            // if best path, just move on
            if (visited.contains(currStudent)) {
                continue;
            }
            visited.add(currStudent);

            // Check if this student has the target internship
            // if student has target company already, wwe are done
            if (!currStudent.equals(start) && currStudent.previousInternships != null && currStudent.previousInternships.contains(targetCompany)) {

                // create list to hold the main final path
                List<UniversityStudent> path = new ArrayList<>();
                UniversityStudent trace = currStudent;

                // follow the links backward until we hit the start
                while (trace != null) {
                    // add to the front so the path is in the right order
                    path.add(0, trace);
                    // move to the student who referred this one
                    trace = prev.get(trace);
                }
                return path;
            }

            // nighbor explorations
            for (StudentGraph.Edge edge : graph.getNeighbors(currStudent)) {
                // if we already visted, ignore
                if (visited.contains(edge.neighbor)) {
                    continue;
                }


                // we want highest weight, but the Dijkstra will find the lowest sum
                // subtract weight from 10 to inver it.
                int invertedWeight = Math.max(0, 10 - edge.weight);
                int newDist = currCost + invertedWeight;

                // if connections gives stringer path, record it.
                if (newDist < dist.get(edge.neighbor)) {
                    // updates best known distance
                    dist.put(edge.neighbor, newDist);
                    // save the link
                    prev.put(edge.neighbor, currStudent);
                    // adds neighbor to queue to explore their friends next
                    queue.offer(new long[]{newDist, studentIndex.get(edge.neighbor)});
                }
            }
        }

        // no path found at this point
        return new ArrayList<>();
    }

}
