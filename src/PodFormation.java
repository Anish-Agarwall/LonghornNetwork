import java.util.*;

public class PodFormation {

    private StudentGraph graph;

    public PodFormation(StudentGraph graph) {
        // Constructor
        this.graph = graph;
    }

    public void formPods(int podSize) {
        // Method signature only

        System.out.println("Pod formation");

        // need to keep track of who hasn;t been put into a pod yet
        Set<UniversityStudent> unvisited = new HashSet<>(graph.getAllNodes());
        List<List<UniversityStudent>> allPods = new ArrayList<>();
        List<UniversityStudent> currentPod = new ArrayList<>();

        // keep going until all pods are visited
        while (!unvisited.isEmpty()) {

            // starting point
            UniversityStudent startNode = unvisited.iterator().next();

            // create a max heap so we get the highest connection first
            PriorityQueue<Object[]> pq = new PriorityQueue<>((a, b) ->
                    Integer.compare((int) b[0], (int) a[0])
            );

            // add it to the prio que
            pq.offer(new Object[]{0, startNode});

            // keep going until the prio que is empty
            while (!pq.isEmpty()) {
                Object[] polled = pq.poll();
                UniversityStudent u = (UniversityStudent) polled[1];

                // skip it if we have already visited the student
                if (!unvisited.contains(u)) {
                    continue;
                }

                // mark as processed and add to the forming pod
                unvisited.remove(u);
                currentPod.add(u);

                // once pod gets target size, save and begin a new one
                if (currentPod.size() == podSize) {
                    allPods.add(new ArrayList<>(currentPod));
                    currentPod.clear();
                }

                // go to all neightbors
                for (StudentGraph.Edge edge : graph.getNeighbors(u)) {
                    if (unvisited.contains(edge.neighbor)) {
                        // use the weight directly
                        pq.offer(new Object[]{edge.weight, edge.neighbor});
                    }
                }
            }
        }

        // add the rest who didn't get a full pod.
        if (!currentPod.isEmpty()) {
            allPods.add(currentPod);
        }

        // print the final formed pods
        for (int i = 0; i < allPods.size(); i++) {
            List<String> names = new ArrayList<>();
            for (UniversityStudent s : allPods.get(i)) {
                names.add(s.name);
            }
            System.out.println("Pod " + (i + 1) + ": " + String.join(", ", names));
        }

    }
}
